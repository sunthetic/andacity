import { resolveInventoryRecord } from "~/lib/inventory/resolveInventory";
import {
  isBookableEntityRouteError,
  parseBookableEntityRouteForVertical,
} from "~/lib/entities/routing";
import type { BookableVertical } from "~/types/bookable-entity";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";
import type { ResolveInventoryRecordInput, ResolvedInventoryRecord } from "~/types/inventory";

type LoadBookableEntityPageDependencies = {
  parseRoute?: typeof parseBookableEntityRouteForVertical;
  resolveRecord?: (
    input: ResolveInventoryRecordInput,
  ) => Promise<ResolvedInventoryRecord | null>;
};

export const loadBookableEntityPage = async (
  input: {
    vertical: BookableVertical;
    route: string | URL | readonly string[];
  },
  dependencies: LoadBookableEntityPageDependencies = {},
): Promise<BookableEntityPageLoadResult> => {
  const parseRoute = dependencies.parseRoute ?? parseBookableEntityRouteForVertical;
  const resolveRecord =
    dependencies.resolveRecord ??
    ((request: ResolveInventoryRecordInput) => resolveInventoryRecord(request));

  try {
    const route = parseRoute(input.vertical, input.route);
    const resolution = await resolveRecord({
      inventoryId: route.inventoryId,
    });

    if (!resolution) {
      return {
        kind: "not_found",
        vertical: input.vertical,
        status: 404,
        route,
        reason: "inventory_unresolved",
        requestedInventoryId: route.inventoryId,
      };
    }

    const resolutionSummary = {
      checkedAt: resolution.checkedAt,
      isAvailable: resolution.isAvailable,
    } as const;

    if (resolution.entity.inventoryId !== route.inventoryId) {
      return {
        kind: "revalidation_required",
        vertical: input.vertical,
        status: 409,
        route,
        entity: resolution.entity,
        resolution: resolutionSummary,
        reason: "inventory_mismatch",
        requestedInventoryId: route.inventoryId,
        resolvedInventoryId: resolution.entity.inventoryId,
      };
    }

    if (resolution.isAvailable === false) {
      return {
        kind: "unavailable",
        vertical: input.vertical,
        status: 409,
        route,
        entity: resolution.entity,
        resolution: resolutionSummary,
        reason: "inventory_unavailable",
      };
    }

    return {
      kind: "resolved",
      vertical: input.vertical,
      status: 200,
      route,
      entity: resolution.entity,
      resolution: resolutionSummary,
    };
  } catch (error) {
    if (isBookableEntityRouteError(error)) {
      return {
        kind: "invalid_route",
        vertical: input.vertical,
        status: error.status,
        pathname:
          typeof input.route === "string"
            ? input.route
            : input.route instanceof URL
              ? input.route.pathname
              : `${input.route.join("/")}`,
        error: error.toJSON(),
      };
    }

    throw error;
  }
};
