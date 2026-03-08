export type FlightCabinClass = 'economy' | 'premium-economy' | 'business' | 'first'
export type FlightTimeWindow = 'morning' | 'afternoon' | 'evening' | 'overnight'

export type FlightResult = {
  id: string
  itineraryId?: number
  serviceDate?: string
  airline: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  departureMinutes: number
  arrivalMinutes: number
  departureWindow: FlightTimeWindow
  arrivalWindow: FlightTimeWindow
  stops: 0 | 1 | 2
  stopsLabel: string
  duration: string
  cabinClass?: FlightCabinClass
  price: number
  currency: string
}
