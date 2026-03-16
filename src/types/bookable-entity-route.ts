import type { ParsedInventoryId } from "~/lib/inventory/inventory-id";
import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";

export type BookableEntityRouteErrorCode =
  | "INVALID_ROUTE_PREFIX"
  | "MALFORMED_ROUTE"
  | "INVALID_INVENTORY_ID";

export type BookableEntityRouteErrorShape = {
  code: BookableEntityRouteErrorCode;
  message: string;
  field?: string;
  value?: string | null;
};

export type ParsedBookableEntityRoute = {
  vertical: BookableVertical;
  inventoryId: string;
  parsedInventory: ParsedInventoryId;
  canonicalPath: string;
  pathname: string;
  segments: string[];
};

export type BookableEntityResolutionSummary = {
  checkedAt: string;
  isAvailable: boolean | null;
};

type BookableEntityRouteBase = {
  vertical: BookableVertical;
  status: number;
  route: ParsedBookableEntityRoute;
};

export type BookableEntityPageResolvedResult = BookableEntityRouteBase & {
  kind: "resolved";
  entity: BookableEntity;
  resolution: BookableEntityResolutionSummary;
};

export type BookableEntityPageUnavailableResult = BookableEntityRouteBase & {
  kind: "unavailable";
  entity: BookableEntity;
  resolution: BookableEntityResolutionSummary;
  reason: "inventory_unavailable";
};

export type BookableEntityPageRevalidationRequiredResult =
  BookableEntityRouteBase & {
    kind: "revalidation_required";
    entity: BookableEntity;
    resolution: BookableEntityResolutionSummary;
    reason: "inventory_mismatch";
    requestedInventoryId: string;
    resolvedInventoryId: string;
  };

export type BookableEntityPageNotFoundResult = BookableEntityRouteBase & {
  kind: "not_found";
  reason: "inventory_unresolved";
  requestedInventoryId: string;
};

export type BookableEntityPageInvalidRouteResult = {
  kind: "invalid_route";
  vertical: BookableVertical;
  status: number;
  pathname: string;
  error: BookableEntityRouteErrorShape;
};

export type BookableEntityPageLoadResult =
  | BookableEntityPageResolvedResult
  | BookableEntityPageUnavailableResult
  | BookableEntityPageRevalidationRequiredResult
  | BookableEntityPageNotFoundResult
  | BookableEntityPageInvalidRouteResult;
