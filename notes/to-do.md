# TO DOs

Credit Card APIS for paywall
EVICTION AND CRIMINAL BACKGROUND CHECKS

ACH PLAID API

##08OCT24
- [] Fix deployment issues
- [] Create fake lease with all of trip details
- [] Create template on AirSlate
- [] Use template to doc gen with details
- [] Kick off workflow
- [] Get both siggies
- [] fix start conversation
- [x] finish resend

## 01OCT24
- [X] On booking set unavailable
- [X] On getTrip adjust query to strip out booked/unavailable
- [X] Add ability to block off without a trip
- [X] Add unavailablePeriods to bookings tab

## 24SEP24
- [X]  Change flow to choose lease at housingRequest approval   
- [x] Store doc Id in match
- [x] Embed on Guest Side
- [x] Use doc Id to pull Sign embed page
- [ ] Worry about auth... somehow? email?
- [ ] Get all applicants from housingRequest, add to lease in db (ensure emails are correct for auth)

## 18SEP24
- [ ]  EMAIL TESTING
- [X] add outbound to query params, read query params to check for user profile, prompt signup if no user profile, prompt login if found, also maybe clerk to see if already signed in  
- [ ] fix tab selector eating other query params
- [ ] build trip specific page
- [ ] add invited trips to current searches
- [ ] implement permissions for searches and affect UI
- [ ] add bold sign template to listing
- [ ] implement bold sign signing side

## 10SEP24
- [ ]  Stripe Connect Integration

## 7 SEP 24
- [ ]  STRIPE PLATFORM PAYMENT
 - [ ]  fix sse server 504 erron on deployed app
   -- 504 is a gateway timeout, likely due to the server not responding in time
   -- this is due to vercel serverless function timeout, which is 10 seconds
   -- possible solutions
      - build server using VPS via linode and GO
      - PUSHER for realtime messaging
      - batch requests
      - use websockets

## 5SEP24
- [x] Add profile photo, last message preview and timestamp to conversation list
- [x] photo upload support for message interface
- [ ] add status to housingRequest (pending, accepted, rejected)

#27AUG24
MOCK SEARCHBUG RESULTS
BUILD FRONTEND AROUND THAT
WHEN HAPPY WITH THAT, GET REAL DATA
REPEAT FOR BACKGROUND CHECKS

##25AUG24
get auth to webhook
OPEN API ACCOUNTS        


## 21AUG24
OPEN UP STRIPE CLI (one to listen and one to trigger)
add Order to DB (include service type, status, isRedeemed)
npx prisma db push
update webhook to save order to db
Success page needs to check for Order (type: backgroundCheck, isRedeemed: false) 
if no order, redirect to please pay, if found proceed with apis

## 20AUG24
STRIPE FROM APPLICATION
STRIPE RECEIPT, DB TRANSACTIONS
Get tile for listing, store image in db, display in match rather than map


## 13AUG24
padding on bottom or footer, prob footer
dialog X for search deletion is FUGLY
finish dialog (filter options, calendar, X to the left, one x, icon import)
 -- Ask Daniel about calendar
carousel (fix height, fix arrows)
ALGO
 -- do feature score
reset carousel api to 0.

[X] 1. Finish application summary

[ ] 2. MAP VIEW
        Kick up coordinates

[ ] 3. New Dashboard
        control bar, populate old data, use popovers, create double calendar, save new dates to trip via handlesave, adults counter, 
        fix infinite scroll
        Matchbook
        hearts on map view listings

[] 4. Add other users&application to housingRequest

[ ] 5. Errors for client side validation 

## Algorithm
U score = Sum of All Scores where Score is (Value/MaxValue * Coeffecient)

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
