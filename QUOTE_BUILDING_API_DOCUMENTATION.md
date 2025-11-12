# Quote Building User Flow - Complete API Documentation

## Table of Contents
1. [Entry Points](#entry-points)
2. [Step 1: Trip Type Selection](#step-1-trip-type-selection)
3. [Step 2: Itinerary Building](#step-2-itinerary-building)
4. [Step 3: User Details](#step-3-user-details)
5. [Step 4: Vehicle Selection](#step-4-vehicle-selection)
6. [Step 5: Additional Amenities](#step-5-additional-amenities)
7. [Additional API Calls](#additional-api-calls)
8. [Auto-Save Behavior](#auto-save-behavior)
9. [Notes](#notes)

---

## Entry Points

### Entry Point 1: New Quote (from Navbar)
- **User Action**: User clicks "Build A Quote" in navbar
- **Initial State**: `draftId = null`, start fresh
- **Flow**: Proceed to Step 1 below

### Entry Point 2: Continue Draft (from Quotes Page)

**User Action**: User navigates to `/quotes`

**API Call**: `GET /api/v1/quotes?status=draft,quote&page=1&limit=20`
- **Query Params**: 
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `status` (array: `draft`, `quote`)
- **Response**: `QuoteListResponse`
  ```json
  {
    "quotes": [
      {
        "quoteId": "uuid",
        "tripName": "string",
        "tripType": "one_way" | "two_way",
        "status": "draft" | "submitted",
        "currentStep": 1-5,
        "totalPrice": 0,
        "createdAt": "date"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
  ```

**User Action**: User clicks on a draft/quote row

**API Call**: `GET /api/v1/quotes/:id`
- **Response**: `QuoteResponse` (full quote data with all fields)
  ```json
  {
    "quoteId": "uuid",
    "userId": "uuid",
    "tripType": "one_way" | "two_way",
    "tripName": "string",
    "eventType": "string",
    "customEventType": "string",
    "passengerCount": 0,
    "status": "draft" | "submitted",
    "currentStep": 1-5,
    "selectedVehicles": [
      {
        "vehicleId": "uuid",
        "quantity": 0
      }
    ],
    "selectedAmenities": ["amenityId1", "amenityId2"],
    "pricing": { /* PricingBreakdownResponse */ },
    "routeData": {
      "outbound": {
        "totalDistance": 0,
        "totalDuration": 0,
        "routeGeometry": "GeoJSON string"
      },
      "return": { /* same structure, optional */ }
    },
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```

**State Changes**: 
- Navigate to `/build-quote?draftId=xxx`
- Load draft data
- Restore to last completed step with all fields pre-filled
- Set `draftId` in state

---

## Step 1: Trip Type Selection

### Initial State
- **New quote**: Empty, no selection
- **Loading draft**: Pre-filled with saved `tripType`

### User Actions and API Calls

#### 1. User Selects Trip Type
- **State Changes**: `tripType` set to `'one_way'` or `'two_way'`
- **If new quote (no draftId)**:
  - **API Call**: `POST /api/v1/quotes`
  - **Request Body**: `CreateQuoteDraftRequest`
    ```json
    {
      "tripType": "one_way" | "two_way"
    }
    ```
  - **Response**: `CreateQuoteDraftResponse`
    ```json
    {
      "quoteId": "uuid",
      "status": "draft",
      "currentStep": 1
    }
    ```
  - **State Changes**: Store `quoteId` for subsequent calls

#### 2. User Clicks "Next"
- **API Call**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "tripType": "one_way" | "two_way",
    "currentStep": 2
  }
  ```
- **Response**: `QuoteResponse`
- **State Changes**: Move to Step 2

---

## Step 2: Itinerary Building

### 2.1 Outbound Itinerary Building

#### Initial State
- **New quote**: Empty map, empty itinerary
- **Loading draft**: Pre-filled with saved outbound itinerary, markers and routes displayed

#### User Actions and API Calls

##### 1. User Searches for Pickup Location
- **Client-side**: Mapbox Geocoder API (no backend call yet)

##### 2. User Selects a Location from Search Results
- **State Changes**: 
  - Pickup location set (address, lat, lng)
  - Marker added to map
  - Map centers on location
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "itinerary": {
      "outbound": [
        {
          "locationName": "string",
          "latitude": 0,
          "longitude": 0,
          "arrivalTime": "ISO date string",
          "departureTime": "ISO date string (optional)",
          "isDriverStaying": false,
          "stayingDuration": 0,
          "stopType": "pickup"
        }
      ]
    }
  }
  ```
- **Response**: `QuoteResponse`

##### 3. User Adds First Stop
- **Client-side**: 
  - Mapbox Geocoder: Search stop location
  - Mapbox Directions API: Calculate route from pickup to stop
  - Calculate distance, duration, route geometry
  - Detect night travel segments
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **State Changes**: 
  - Stop added to stops array
  - Route polyline drawn on map
  - Distance/time displayed for segment

##### 4. User Adds More Stops
- **Client-side**: For each new stop:
  - Mapbox Directions API: Calculate route from previous location to new stop
  - Recalculate full route if needed
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest` with updated `outbound` array

##### 5. User Adds Dropoff (One-Way) or Last Stop (Two-Way)
- **Client-side**: 
  - Mapbox Directions API: Calculate route from last stop to dropoff
  - Calculate total distance, duration for outbound
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`

##### 6. User Configures Stop Details (Driver Stay, Pickup Time/Date)
- **State Changes**: 
  - Stop data updated
  - If driver stay checked → show time/date fields
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "itinerary": {
      "outbound": [
        {
          "isDriverStaying": true,
          "stayingDuration": 24,
          "departureTime": "ISO date string"
        }
      ]
    }
  }
  ```

##### 7. User Reorders Stops (Drag & Drop)
- **State Changes**: 
  - Stops array reordered
  - Routes recalculated for new order
- **Client-side**: Mapbox Directions API: Recalculate routes for new order
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`

##### 8. User Modifies Outbound Itinerary
- **State Changes**: 
  - If two-way trip and return tab is enabled:
    - Auto-update return pickup = new last location
    - Auto-update return dropoff = new first location
    - Show notification: "Return pickup updated to [location name]"
    - Show notification: "Return dropoff updated to [location name]"
- **Client-side**: Mapbox Directions API: Recalculate routes
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id` - includes both outbound and return updates

##### 9. User Clicks "Next" (Outbound Validated)
- **API Call**: `POST /api/v1/quotes/:id/calculate-routes`
- **Request Body**: `CalculateRoutesRequest`
  ```json
  {
    "itinerary": {
      "outbound": [
        {
          "locationName": "string",
          "latitude": 0,
          "longitude": 0,
          "arrivalTime": "ISO date string",
          "departureTime": "ISO date string (optional)",
          "isDriverStaying": false,
          "stayingDuration": 0,
          "stopType": "pickup" | "stop" | "dropoff"
        }
      ],
      "return": [] // optional, only for two-way
    }
  }
  ```
- **Response**: `RouteCalculationResponse`
  ```json
  {
    "outbound": {
      "totalDistance": 0,
      "totalDuration": 0,
      "routeGeometry": "GeoJSON string",
      "segments": [
        {
          "from": {
            "latitude": 0,
            "longitude": 0,
            "locationName": "string"
          },
          "to": {
            "latitude": 0,
            "longitude": 0,
            "locationName": "string"
          },
          "distance": 0,
          "duration": 0,
          "hasNightTravel": false
        }
      ]
    },
    "return": {
      /* same structure, optional */
    }
  }
  ```
- **Then**: `PUT /api/v1/quotes/:id` to save `currentStep: 2`
- **State Changes**: 
  - If two-way: Return tab becomes enabled (no longer grayed out)
  - Auto-populate return itinerary:
    - Return pickup = outbound last location
    - Return dropoff = outbound first location (pickup)
  - Stay on Step 2 (user can now build return)

### 2.2 Return Itinerary Building (Two-Way Only)

#### State After "Next" Click
- Return tab enabled
- Return pickup and dropoff auto-populated
- User can toggle between Outbound and Return tabs

#### User Actions and API Calls

##### 1. User Switches to "Return" Tab
- **State Changes**: 
  - Map view switches to "Return View"
  - Map shows return locations only
  - Different colored markers for return route
- **No API calls** (just UI toggle)

##### 2. User Modifies Return Pickup/Dropoff
- **Client-side**: 
  - Mapbox Geocoder: Search if new location
  - Mapbox Directions API: Calculate return route
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest` with both `outbound` and `return`

##### 3. User Adds Stops to Return Trip
- **Client-side**: Mapbox Directions API: Calculate routes for return stops
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`

##### 4. User Clicks "Next" (Both Outbound and Return Validated)
- **API Call**: `POST /api/v1/quotes/:id/calculate-routes` (with both outbound and return)
- **Then**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "itinerary": {
      "outbound": [...],
      "return": [...]
    },
    "currentStep": 3
  }
  ```
- **Response**: `QuoteResponse`
- **State Changes**: Move to Step 3

---

## Step 3: User Details

### Initial State
- **New quote**: Empty form
- **Loading draft**: Pre-filled with saved trip name, event type, passengers

### User Actions and API Calls

#### 1. On Mount: Fetch Event Types
- **API Call**: `GET /api/v1/event-types`
- **Response**: `EventTypeResponse[]`
  ```json
  [
    {
      "eventTypeId": "uuid",
      "name": "Wedding",
      "isCustom": false,
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
  ```

#### 2. User Enters Trip Name
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "tripName": "string"
  }
  ```

#### 3. User Selects Event Type
- **State Changes**: 
  - If "Other" selected → show custom event type field
  - If predefined → hide custom field
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "eventType": "Wedding" | "Other",
    "customEventType": "string (if Other selected)"
  }
  ```
- **If "Other" and custom event type entered**:
  - **API Call**: `POST /api/v1/event-types`
  - **Request Body**: `CreateCustomEventTypeRequest`
    ```json
    {
      "name": "string"
    }
    ```
  - **Response**: `EventTypeResponse`
    ```json
    {
      "eventTypeId": "uuid",
      "name": "string",
      "isCustom": true,
      "createdAt": "date",
      "updatedAt": "date"
    }
    ```

#### 4. User Adds Passenger
- **State Changes**: Passenger form appears
- **User fills**: name, age, phone number
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "passengers": [
      {
        "fullName": "string",
        "phoneNumber": "string",
        "age": 0
      }
    ]
  }
  ```

#### 5. User Adds More Passengers or Removes Passenger
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`

#### 6. User Clicks "Next"
- **API Call**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "tripName": "string",
    "eventType": "string",
    "customEventType": "string (optional)",
    "passengers": [
      {
        "fullName": "string",
        "phoneNumber": "string",
        "age": 0
      }
    ],
    "currentStep": 4
  }
  ```
- **Response**: `QuoteResponse`
- **State Changes**: 
  - Move to Step 4
  - Calculate total passenger count for vehicle recommendations

---

## Step 4: Vehicle Selection

### Initial State
- **New quote**: No vehicles selected
- **Loading draft**: Pre-filled with saved selected vehicles

### User Actions and API Calls

#### 1. On Mount: Get Vehicle Recommendations
- **API Call**: `POST /api/v1/quotes/recommendations`
- **Request Body**: `GetRecommendationsRequest`
  ```json
  {
    "passengerCount": 0,
    "tripStartDate": "ISO date string",
    "tripEndDate": "ISO date string",
    "tripType": "one_way" | "two_way"
  }
  ```
- **Response**: `VehicleRecommendationResponse`
  ```json
  {
    "recommendations": [
      {
        "optionId": "uuid",
        "vehicles": [
          {
            "vehicleId": "uuid",
            "vehicleTypeId": "uuid",
            "name": "string",
            "capacity": 0,
            "quantity": 0
          }
        ],
        "totalCapacity": 0,
        "estimatedPrice": 0,
        "isExactMatch": true
      }
    ],
    "availableVehicles": [
      {
        "vehicleId": "uuid",
        "vehicleTypeId": "uuid",
        "name": "string",
        "capacity": 0,
        "baseFare": 0,
        "isAvailable": true,
        "availableQuantity": 0,
        "includedAmenities": [
          {
            "amenityId": "uuid",
            "name": "string"
          }
        ]
      }
    ]
  }
  ```
- **State Changes**: 
  - Display recommended vehicle options (top 3-5)
  - Display all available vehicles (filtered by availability)
  - Show message if no exact matches: "No vehicles match exactly, showing all available options"

#### 2. User Views Recommended Options
- **UI State**: Recommended section shows:
  - Option 1: "1 Coach Bus - 54 seats" (exact match)
  - Option 2: "2 Mini Buses - 30 seats each" (combination)
  - Option 3: "1 Large Bus + 1 Mini Bus" (combination)
  - Each option shows: vehicles, total capacity, estimated price

#### 3. User Selects a Recommended Option
- **State Changes**: 
  - Selected vehicles set: `[{ vehicleId, quantity }, ...]`
  - Show selected vehicles in "Selected" section
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "selectedVehicles": [
      {
        "vehicleId": "uuid",
        "quantity": 0
      }
    ]
  }
  ```

#### 4. User Chooses Custom Selection Instead
- **State Changes**: 
  - Show "Browse All" section
  - User can select vehicles manually with quantity selector
  - Filter by availability
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`

#### 5. User Changes Passenger Count (Goes Back to Step 3 and Modifies)
- **State Changes**: Return to Step 4
- **API Calls**: 
  - `POST /api/v1/quotes/recommendations` (with new passenger count)
  - Recalculate recommendations automatically

#### 6. User Clicks "Next"
- **API Call**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "selectedVehicles": [
      {
        "vehicleId": "uuid",
        "quantity": 0
      }
    ],
    "currentStep": 5
  }
  ```
- **Response**: `QuoteResponse`
- **State Changes**: Move to Step 5

---

## Step 5: Additional Amenities

### Initial State
- **New quote**: No amenities selected
- **Loading draft**: Pre-filled with saved selected amenities

### User Actions and API Calls

#### 1. On Mount: Get Paid Amenities
- **API Call**: `GET /api/v1/amenities/paid` (existing endpoint)
- **Response**: Filter out amenities already included in selected vehicles
- **State Changes**: 
  - Display available paid amenities as selectable cards
  - Show price for each amenity
  - Show "Already included" message for amenities in vehicles

#### 2. User Selects Additional Amenities
- **State Changes**: 
  - Selected amenities added to list
  - Show quantity selector if applicable
- **Auto-save (debounced 500ms)**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "selectedAmenities": ["amenityId1", "amenityId2"]
  }
  ```

#### 3. User Clicks "Complete Quote" or "Create Quote"
- **Final save**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest`
  ```json
  {
    "selectedAmenities": ["amenityId1", "amenityId2"],
    "currentStep": 5
  }
  ```
- **Then**: `POST /api/v1/quotes/:id/submit`
- **Response**: `SubmitQuoteResponse`
  ```json
  {
    "quoteId": "uuid",
    "status": "submitted",
    "pricing": {
      "fuelPriceAtTime": 0,
      "averageDriverRateAtTime": 0,
      "taxPercentageAtTime": 0,
      "baseFare": 0,
      "distanceFare": 0,
      "driverCharge": 0,
      "fuelMaintenance": 0,
      "nightCharge": 0,
      "stayingCharge": 0,
      "amenitiesTotal": 0,
      "subtotal": 0,
      "tax": 0,
      "total": 0
    }
  }
  ```
- **State Changes**: 
  - Quote created successfully
  - Show success message
  - Redirect to quotes page (`/quotes`)
  - Draft is now a quote (status: `"quote"`) and appears in quotes table
- **Email**: Confirmation email sent automatically (doesn't block submission if it fails)

---

## Additional API Calls

### Calculate Pricing (Optional - Can be Called Anytime After Step 2)
- **API Call**: `POST /api/v1/quotes/:id/calculate-pricing`
- **Response**: `PricingBreakdownResponse`
  ```json
  {
    "fuelPriceAtTime": 0,
    "averageDriverRateAtTime": 0,
    "taxPercentageAtTime": 0,
    "baseFare": 0,
    "distanceFare": 0,
    "driverCharge": 0,
    "fuelMaintenance": 0,
    "nightCharge": 0,
    "stayingCharge": 0,
    "amenitiesTotal": 0,
    "subtotal": 0,
    "tax": 0,
    "total": 0
  }
  ```

### Delete Draft
- **API Call**: `DELETE /api/v1/quotes/:id`
- **Response**: `204 No Content`
- **Note**: Can only delete drafts (status: `draft`)

---

## Auto-Save Behavior

### Debounce Timing
- **Debounced saves**: 500ms delay
- **Immediate saves**: On "Next" button clicks, final submission

### When Auto-Save is Triggered
- Field changes (trip name, event type)
- Location additions/modifications
- Passenger additions/removals
- Vehicle selections
- Amenity selections
- Stop configuration changes

### Auto-Save Endpoint
- **All auto-saves use**: `PUT /api/v1/quotes/:id`
- **Request Body**: `UpdateQuoteDraftRequest` (only send changed fields)
- **Response**: `QuoteResponse`

---

## Notes

### Authentication
- **All endpoints require**: `Authorization: Bearer <token>` header
- **Authentication middleware**: Validates JWT token on all routes

### Error Handling
- **All endpoints return standard error format on failure**:
  ```json
  {
    "success": false,
    "error": "Error message",
    "code": "ERROR_CODE"
  }
  ```

### Validation
- **Request bodies are validated** using `class-validator`
- **Validation errors return**: 400 Bad Request with detailed field errors

### Status Flow
- **Draft**: `draft` (steps 1-5, incomplete)
- **Submitted**: `submitted` (all 5 steps complete, pricing calculated)

### Email Integration
- **Email sent automatically** on quote submission
- **Non-blocking**: Email failures don't prevent quote submission
- **Email contains**: Quote ID, trip name, trip type, total price, quote date

### Route Calculation
- **Routes are calculated** using Mapbox Directions API
- **Stored in quote**: Total distance, total duration, route geometry (GeoJSON)
- **Night travel detection**: Automatically detected for pricing calculations

### Pricing Calculation
- **Components**:
  - `baseFare`: From selected vehicles
  - `distanceFare`: Distance × fuel consumption × fuel price
  - `driverCharge`: Driver per-hour rate × hours needed
  - `nightCharge`: Driver per-night rate (10 PM - 6 AM)
  - `stayingCharge`: Per-day rate for driver stays ≥ 1 day
  - `amenitiesTotal`: Sum of selected paid amenities
  - `tax`: Percentage of subtotal
  - `fuelMaintenance`: Returns 0 (fuel cost included in distanceFare)

### Vehicle Recommendations
- **Algorithm**: Finds exact matches and combinations
- **Sorting**: Exact matches first, then by capacity closest to passenger count
- **Returns**: Top 5 recommendations

### Event Types
- **Predefined**: Wedding, Corporate, etc.
- **Custom**: User can create custom event types
- **Validation**: Custom event type name must be unique

---

## Complete API Endpoint Summary

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|-----------|
| GET | `/api/v1/quotes` | Get quotes list | Query params | `QuoteListResponse` |
| GET | `/api/v1/quotes/:id` | Get quote by ID | - | `QuoteResponse` |
| POST | `/api/v1/quotes` | Create quote draft | `CreateQuoteDraftRequest` | `CreateQuoteDraftResponse` |
| PUT | `/api/v1/quotes/:id` | Update quote draft | `UpdateQuoteDraftRequest` | `QuoteResponse` |
| DELETE | `/api/v1/quotes/:id` | Delete quote draft | - | `204 No Content` |
| POST | `/api/v1/quotes/:id/calculate-routes` | Calculate routes | `CalculateRoutesRequest` | `RouteCalculationResponse` |
| POST | `/api/v1/quotes/recommendations` | Get vehicle recommendations | `GetRecommendationsRequest` | `VehicleRecommendationResponse` |
| POST | `/api/v1/quotes/:id/calculate-pricing` | Calculate pricing | - | `PricingBreakdownResponse` |
| POST | `/api/v1/quotes/:id/submit` | Submit quote | - | `SubmitQuoteResponse` |
| GET | `/api/v1/event-types` | Get event types | - | `EventTypeResponse[]` |
| POST | `/api/v1/event-types` | Create custom event type | `CreateCustomEventTypeRequest` | `EventTypeResponse` |

---

## Request/Response DTOs Reference

### CreateQuoteDraftRequest
```typescript
{
  tripType: "one_way" | "two_way"
}
```

### UpdateQuoteDraftRequest
```typescript
{
  tripType?: "one_way" | "two_way",
  currentStep?: number (1-5),
  itinerary?: {
    outbound: ItineraryStopDto[],
    return?: ItineraryStopDto[]
  },
  tripName?: string,
  eventType?: string,
  customEventType?: string,
  passengers?: PassengerDto[],
  selectedVehicles?: SelectedVehicleDto[],
  selectedAmenities?: string[]
}
```

### ItineraryStopDto
```typescript
{
  locationName: string,
  latitude: number,
  longitude: number,
  arrivalTime: string (ISO date),
  departureTime?: string (ISO date),
  isDriverStaying?: boolean,
  stayingDuration?: number,
  stopType: "pickup" | "stop" | "dropoff"
}
```

### PassengerDto
```typescript
{
  fullName: string,
  phoneNumber: string,
  age: number
}
```

### SelectedVehicleDto
```typescript
{
  vehicleId: string,
  quantity: number
}
```

### CalculateRoutesRequest
```typescript
{
  itinerary: {
    outbound: ItineraryStopDto[],
    return?: ItineraryStopDto[]
  }
}
```

### GetRecommendationsRequest
```typescript
{
  passengerCount: number,
  tripStartDate: string (ISO date),
  tripEndDate: string (ISO date),
  tripType: "one_way" | "two_way"
}
```

### CreateCustomEventTypeRequest
```typescript
{
  name: string
}
```

---

**Last Updated**: Based on current implementation as of latest commit

