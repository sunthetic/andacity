import {
  getTripDetails,
  TripRepoError,
} from "~/lib/repos/trips-repo.server";
import {
  ADD_TO_TRIP_DUPLICATE_POLICY,
  type AddToTripDuplicatePolicy,
  type AddToTripErrorCode,
} from "~/lib/trips/add-to-trip-feedback";
import {
  addBookableEntityToTrip,
  createTripAssembly,
  TripAssemblyError,
} from "~/lib/trips/trip-assembly-engine";
import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type {
  BookableEntityPageLoadResult,
  BookableEntityPageResolvedResult,
} from "~/types/bookable-entity-route";
import type { TripDetails } from "~/types/trips/trip";
import { loadBookableEntityPage } from "~/server/entities/loadBookableEntityPage";

export class AddBookableEntityToTripError extends Error {
  readonly code: AddToTripErrorCode;

  constructor(code: AddToTripErrorCode, message: string) {
    super(message);
    this.name = "AddBookableEntityToTripError";
    this.code = code;
  }
}

type AddBookableEntityPageToTripDependencies = {
  loadPageFn: typeof loadBookableEntityPage;
  getTripDetailsFn: typeof getTripDetails;
  createTripAssemblyFn: typeof createTripAssembly;
  addBookableEntityToTripFn: typeof addBookableEntityToTrip;
};

const defaultDependencies =
  (): AddBookableEntityPageToTripDependencies => ({
    loadPageFn: loadBookableEntityPage,
    getTripDetailsFn: getTripDetails,
    createTripAssemblyFn: createTripAssembly,
    addBookableEntityToTripFn: addBookableEntityToTrip,
  });

const buildDefaultTripName = (entity: BookableEntity) => {
  const title = String(entity.title || "").trim();
  return title ? `Trip for ${title}` : "New trip";
};

const toAddToTripPageError = (page: BookableEntityPageLoadResult) => {
  if (page.kind === "invalid_route" || page.kind === "not_found") {
    return new AddBookableEntityToTripError(
      "invalid_entity_reference",
      "The canonical entity reference could not be resolved for Add to Trip.",
    );
  }

  if (page.kind === "unavailable") {
    return new AddBookableEntityToTripError(
      "entity_unavailable",
      `The canonical ${page.vertical} entity is no longer available for booking.`,
    );
  }

  if (page.kind === "revalidation_required") {
    return new AddBookableEntityToTripError(
      "revalidation_required",
      `The canonical ${page.vertical} entity drifted and must be reopened from fresh search results before it can be added.`,
    );
  }

  if (page.kind === "resolution_error") {
    return new AddBookableEntityToTripError(
      "entity_resolution_failed",
      page.message ||
        `Inventory Resolver could not confirm this canonical ${page.vertical} entity before the trip mutation ran.`,
    );
  }

  return new AddBookableEntityToTripError(
    "invalid_entity_reference",
    "The canonical entity reference could not be resolved for Add to Trip.",
  );
};

const requireResolvedPage = (
  page: BookableEntityPageLoadResult,
): BookableEntityPageResolvedResult => {
  if (page.kind === "resolved") {
    return page;
  }

  throw toAddToTripPageError(page);
};

const mapTripRepoError = (
  error: TripRepoError,
  fallback: AddToTripErrorCode,
) => {
  if (error.code === "trip_not_found") {
    return "trip_not_found" as const;
  }

  if (
    error.code === "trip_schema_missing" ||
    error.code === "trip_runtime_stale"
  ) {
    return "trip_persistence_unavailable" as const;
  }

  return fallback;
};

const mapTripAssemblyError = (error: TripAssemblyError) => {
  if (error.code === "inventory_unavailable") {
    return "entity_unavailable" as const;
  }

  if (error.code === "trip_not_found") {
    return "trip_not_found" as const;
  }

  return "persistence_failed" as const;
};

const wrapUnknownFailure = (
  code: AddToTripErrorCode,
  error: unknown,
  fallbackMessage: string,
) =>
  new AddBookableEntityToTripError(
    code,
    error instanceof Error && error.message ? error.message : fallbackMessage,
  );

const resolveTargetTrip = async (
  input: {
    preferredTripId?: number | null;
    entity: BookableEntity;
  },
  dependencies: AddBookableEntityPageToTripDependencies,
) => {
  if (input.preferredTripId) {
    try {
      const trip = await dependencies.getTripDetailsFn(input.preferredTripId);
      if (!trip) {
        throw new AddBookableEntityToTripError(
          "trip_not_found",
          `Trip ${input.preferredTripId} was not found.`,
        );
      }

      return {
        trip,
        strategy: "requested_trip" as const,
      };
    } catch (error) {
      if (error instanceof AddBookableEntityToTripError) throw error;
      if (error instanceof TripRepoError) {
        throw new AddBookableEntityToTripError(
          mapTripRepoError(error, "persistence_failed"),
          error.message,
        );
      }

      throw wrapUnknownFailure(
        "persistence_failed",
        error,
        "Failed to load the requested trip.",
      );
    }
  }

  try {
    const trip = await dependencies.createTripAssemblyFn({
      name: buildDefaultTripName(input.entity),
    });

    return {
      trip,
      strategy: "created_trip" as const,
    };
  } catch (error) {
    if (error instanceof TripRepoError) {
      throw new AddBookableEntityToTripError(
        mapTripRepoError(error, "trip_creation_failed"),
        error.message,
      );
    }

    if (error instanceof TripAssemblyError) {
      throw new AddBookableEntityToTripError("trip_creation_failed", error.message);
    }

    throw wrapUnknownFailure(
      "trip_creation_failed",
      error,
      "Failed to create a trip for this canonical entity.",
    );
  }
};

export const addBookableEntityPageToTrip = async (
  input: {
    vertical: BookableVertical;
    route: string | URL | readonly string[];
    preferredTripId?: number | null;
  },
  options: {
    dependencies?: Partial<AddBookableEntityPageToTripDependencies>;
  } = {},
): Promise<{
  trip: TripDetails;
  entity: BookableEntity;
  duplicatePolicy: AddToTripDuplicatePolicy;
  tripResolution: "requested_trip" | "created_trip";
}> => {
  const dependencies = {
    ...defaultDependencies(),
    ...(options.dependencies || {}),
  } satisfies AddBookableEntityPageToTripDependencies;

  const page = requireResolvedPage(
    await dependencies.loadPageFn({
      vertical: input.vertical,
      route: input.route,
    }),
  );

  const targetTrip = await resolveTargetTrip(
    {
      preferredTripId: input.preferredTripId,
      entity: page.entity,
    },
    dependencies,
  );

  try {
    const trip = await dependencies.addBookableEntityToTripFn({
      tripId: targetTrip.trip.id,
      entity: page.entity,
    });

    return {
      trip,
      entity: page.entity,
      duplicatePolicy: ADD_TO_TRIP_DUPLICATE_POLICY,
      tripResolution: targetTrip.strategy,
    };
  } catch (error) {
    if (error instanceof TripRepoError) {
      throw new AddBookableEntityToTripError(
        mapTripRepoError(error, "persistence_failed"),
        error.message,
      );
    }

    if (error instanceof TripAssemblyError) {
      throw new AddBookableEntityToTripError(
        mapTripAssemblyError(error),
        error.message,
      );
    }

    throw wrapUnknownFailure(
      "persistence_failed",
      error,
      "Failed to add this canonical entity to the trip.",
    );
  }
};
