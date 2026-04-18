# Requirements Document

## Introduction

Marathon Live Tracker is a single-page web application that displays the 2026 Boston Marathon course on a full-screen interactive map and simulates a runner's live position along the course. The runner's position is calculated client-side using a pacing plan (miles-to-pace table), a user-provided start time, and the current wall-clock time. Spectators can use the app to estimate where the runner is at any moment during the race. The app is built with vanilla HTML/CSS/JS and Mapbox GL JS.

## Glossary

- **Map_View**: The full-screen Mapbox GL JS map component that renders the course and runner position
- **Course_Renderer**: The component responsible for drawing the 2026 Boston Marathon course polyline on the map from GeoJSON data
- **Runner_Marker**: The animated map marker representing the runner's estimated current position on the course
- **Position_Calculator**: The client-side module that computes the runner's position along the course geometry using the pacing plan, start time, and current time
- **Pacing_Plan**: A data table mapping each marathon mile (1–26.2) to a pace value in minutes per mile
- **Start_Time_Input**: The UI control that allows the user to enter or modify the runner's start time
- **Cookie_Store**: The browser cookie used to persist the runner's start time across sessions
- **View_Toggle**: The map control that switches between standard/vector and satellite map styles
- **Cumulative_Time_Table**: A derived table that maps each mile marker to the cumulative elapsed time from the start, computed from the Pacing_Plan
- **Debug_Mode**: A hidden application mode that replaces the real wall-clock time with a user-controlled simulated time, allowing developers and testers to scrub through the entire race timeline
- **Time_Slider**: A range input control (0–100%) visible only when Debug_Mode is enabled, representing the runner's progress from start time to estimated finish time
- **Hamburger_Menu**: A collapsible menu icon that contains the Debug_Mode toggle, keeping it hidden from regular spectators

## Requirements

### Requirement 1: Full-Screen Map Display

**User Story:** As a spectator, I want the map to fill the entire browser viewport, so that I have maximum visibility of the marathon course and runner position.

#### Acceptance Criteria

1. WHEN the application loads, THE Map_View SHALL render a Mapbox GL JS map that fills 100% of the browser viewport width and height
2. WHEN the browser window is resized, THE Map_View SHALL resize to fill the new viewport dimensions within 200ms
3. WHEN the application loads, THE Map_View SHALL center on the 2026 Boston Marathon course with a zoom level that fits the entire course within the viewport

### Requirement 2: Marathon Course Rendering

**User Story:** As a spectator, I want to see the 2026 Boston Marathon course drawn on the map, so that I can understand the route the runner is following.

#### Acceptance Criteria

1. WHEN the map finishes loading, THE Course_Renderer SHALL draw the 2026 Boston Marathon course as a visible polyline on the Map_View using GeoJSON LineString data
2. THE Course_Renderer SHALL render the course polyline with a distinct color and sufficient line width to be clearly visible at all zoom levels
3. WHEN the user zooms or pans the map, THE Course_Renderer SHALL maintain the course polyline rendering without visual artifacts

### Requirement 3: Runner Position Calculation

**User Story:** As a spectator, I want the app to calculate the runner's estimated position based on their pacing plan and start time, so that I can know approximately where the runner is right now.

#### Acceptance Criteria

1. THE Position_Calculator SHALL compute a Cumulative_Time_Table by summing the Pacing_Plan pace values from mile 1 through mile 26.2
2. WHEN the current time is after the start time and before the estimated finish time, THE Position_Calculator SHALL determine the runner's distance along the course by finding the elapsed time in the Cumulative_Time_Table and interpolating between mile markers
3. WHEN the current time is before the start time, THE Position_Calculator SHALL place the Runner_Marker at the start of the course
4. WHEN the current time is after the estimated finish time, THE Position_Calculator SHALL place the Runner_Marker at the finish of the course
5. THE Position_Calculator SHALL use linear interpolation along the course GeoJSON geometry to convert the calculated distance into a geographic coordinate

### Requirement 4: Live Runner Marker

**User Story:** As a spectator, I want to see a marker on the map showing the runner's current estimated position, so that I can track their progress in real time.

#### Acceptance Criteria

1. WHEN the Position_Calculator produces a new coordinate, THE Runner_Marker SHALL display at that coordinate on the Map_View
2. THE Runner_Marker SHALL update its position at least once every second to provide a smooth simulation
3. THE Runner_Marker SHALL be visually distinct from the course polyline and other map elements
4. WHEN the Runner_Marker position updates, THE Runner_Marker SHALL animate smoothly between the previous and new positions

### Requirement 5: Pacing Plan Data

**User Story:** As a spectator, I want the app to use a predefined pacing plan, so that the runner's position estimate is based on their expected pace per mile.

#### Acceptance Criteria

1. THE Pacing_Plan SHALL contain an entry for each marathon mile from mile 1 through mile 26 and a final entry for the remaining 0.2 miles
2. THE Pacing_Plan SHALL store each entry as a mile number and a pace value in minutes per mile
3. WHEN the application loads, THE Position_Calculator SHALL read the Pacing_Plan and compute the Cumulative_Time_Table before rendering the Runner_Marker

### Requirement 6: Start Time Input and Persistence

**User Story:** As a spectator, I want to set the runner's start time and have it remembered across visits, so that I don't have to re-enter it every time I open the app.

#### Acceptance Criteria

1. WHEN the application loads and no start time cookie exists, THE Start_Time_Input SHALL prompt the user to enter a start time before the simulation begins
2. WHEN the user enters a valid start time, THE Cookie_Store SHALL save the start time as a browser cookie with a minimum expiration of 7 days
3. WHEN the application loads and a start time cookie exists, THE Position_Calculator SHALL use the stored start time to begin the simulation automatically
4. WHEN the user clicks the "Set Piotr Start Time" button, THE Start_Time_Input SHALL display a time input allowing the user to change the start time
5. WHEN the user submits a new start time via the Start_Time_Input, THE Cookie_Store SHALL update the stored cookie with the new value and THE Position_Calculator SHALL recalculate the runner's position immediately
6. IF the user enters an invalid start time value, THEN THE Start_Time_Input SHALL display a validation error message and retain the previous start time

### Requirement 7: Map View Toggle

**User Story:** As a spectator, I want to switch between a standard map view and a satellite view, so that I can choose the visual style that helps me best understand the runner's location.

#### Acceptance Criteria

1. THE View_Toggle SHALL be visible on the Map_View as a button or control
2. WHEN the user activates the View_Toggle, THE Map_View SHALL switch between the Mapbox standard/vector style and the Mapbox satellite style
3. WHEN the map style changes, THE Course_Renderer SHALL continue to display the course polyline and THE Runner_Marker SHALL remain at its current position
4. THE View_Toggle SHALL indicate which style is currently active

### Requirement 8: Course Data Accuracy

**User Story:** As a spectator, I want the displayed course to accurately represent the 2026 Boston Marathon route, so that the runner's estimated position is meaningful relative to real-world landmarks.

#### Acceptance Criteria

1. THE Course_Renderer SHALL use GeoJSON LineString coordinates that represent the official 2026 Boston Marathon route from Hopkinton to Boston
2. THE Course_Renderer SHALL encode the course with sufficient coordinate density to accurately represent turns and curves along the route


### Requirement 9: Debug Mode

**User Story:** As a developer, I want a debug mode that lets me simulate any point in the race using a time slider, so that I can test and verify the app's behavior without waiting for real time to pass.

#### Acceptance Criteria

1. THE Hamburger_Menu SHALL be visible on the Map_View as a collapsible icon that does not draw attention from regular spectators
2. WHEN the user opens the Hamburger_Menu, THE Hamburger_Menu SHALL display a toggle control to enable or disable Debug_Mode
3. WHEN the user enables Debug_Mode, THE Time_Slider SHALL appear on the Map_View allowing the user to select a value from 0% to 100% representing progress from the start time to the estimated finish time
4. WHILE Debug_Mode is enabled, THE Position_Calculator SHALL use the simulated time derived from the Time_Slider value instead of the real wall-clock time
5. WHEN the user moves the Time_Slider, THE Runner_Marker SHALL update its position on the Map_View to reflect the simulated race progress
6. WHEN the user disables Debug_Mode, THE Time_Slider SHALL be hidden and THE Position_Calculator SHALL resume using the real wall-clock time
7. WHILE Debug_Mode is disabled, THE Position_Calculator SHALL ignore the Time_Slider value and use the real wall-clock time exclusively
