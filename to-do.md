# TO DOs

## TONIGHT

[X] 1. Finish application summary

[ ] 2. MAP VIEW
       Change cards to match design
       Add actions

[ ] 3. New Dashboard

[] 4. Add other users&application to housingRequest

[ ] 5. Errors for client side validation 


store in db, fetch on host side

Check for trip specific application
        Check for default application
If application load to application tab
If no leave blank

## Matching (Trip View)

[x] 1. Photo display left, 4x4 grid on right - New component
   - [ ] Grid needs special handling for 1, 2, 3, 4+ images - New component, child of carousel (tabled for now)

[ ] 2. Layout other details below carousel
        - [x] Almost there need tiles
        - [ ] Replace Amenities
        - [ ] Add whitespace to lower layout

[X] 3. Like/Dislike - Pass to Properties you love
   - [x] Create housingRequest (needs new name, maybe heart, maybe favorites)

   - [x] shown listings does not include matches

   - [x] Handle backing up by removing from relevant array

[ ] 4. Trip Editor

[ ] 5. Trip location Properties update (state, city, etc..) via locationIq at tripCreation/trip View

[ ] 6. Create rating property in listing model, Decimal (4.9) or string (?.?)

[ ] 7. Update listing card to allow onclick and button label, rename to TripListingCard

[ ] 8. Add notification on apply, add circle to userMenu, when click notification send to property dashboard, implemennt params routing to go right to applications

[ ] 9. Update Sets to Maps to allow for sorting by created at
## Coming Soon (marketing page)

[x] 0. Tab view for marketing branch (main/comingSoon)

[x] 1. Overlay for inputs

[ ] 2. Framer motion padding shrink for header and heart

[ ] 3. SVG fix for apartmentIcon (looking to rent Icon)

## Calendar

[ ] 1. Circle Icons

[ ] 2. Color darkening

## Image Upload 

1. Better Drag and Drop

2. Image compression/sharpening

3. Image Cropping

## Test Listings

[x] 1. Get it working

[x] 2. Fix Image allocation

[x] 3. Fix State

[x] 4. Lower resolution of test photos

[ ] 5. Finish match view
        Fix height issue between carousel and lead image on diff screen sizes (Kill me)

## Refactors

[ ] 1. Move amenities to their own model


## Host View

[ ] 1. Add listing preview

[ ] 2. Utilities Included 

[ ] 3. House Rules 

[ ] 4. Counters in Add property bathroom or bedroom count quare footabe 50


## Third Part

[ ] 1. Retool

[ ] 2. Bold Desk


## Auth 

1. Create user in platform layout page load

## ROUTING ERROR
Error: Clerk: The "/platform/trips/e0366d74-2974-403a-bc35-d453a073b94e" route is not a catch-all route. It is recommended to convert this route to a catch-all route, eg: "/platform/trips/e0366d74-2974-403a-bc35-d453a073b94e/[[...rest]]/page.tsx". Alternatively, update the SignIn component to use hash-based routing by setting the "routing" prop to "hash".
