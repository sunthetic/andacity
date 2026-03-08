export type CarRentalsPriceBand = 'under-50' | '50-100' | '100-150' | '150-plus'

export type CarRentalsPickupType = 'airport' | 'city'

export type CarRentalsTransmission = 'automatic' | 'manual'

export type CarRentalsSelectedFilters = {
  vehicleClasses: string[]
  pickupType: CarRentalsPickupType | ''
  transmission: CarRentalsTransmission | ''
  seatsMin: number | null
  priceBand: CarRentalsPriceBand | ''
}

export type CarRentalsVehicleClassFacet = {
  value: string
  label: string
}

export type CarRentalsSearchFacets = {
  vehicleClasses: CarRentalsVehicleClassFacet[]
  pickupTypes: CarRentalsPickupType[]
  transmissions: CarRentalsTransmission[]
  seats: number[]
}
