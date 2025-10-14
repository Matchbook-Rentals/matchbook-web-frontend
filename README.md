# MATCHBOOK MONOREPO

The purpose of this application is to provide renters a way to browse medium-term primary rentals and seamlessly apply, be verified and pay. This requires stripe integration, renter/host verification, messaging, file upload, browsing UI, payment manasgemnt and admin tooling for customer support. 

## App Flow

### Auth
Sign in is handled at /sign-in OR sign-up with an optional redirect url param falling back to the home page without this param. Clerk handles our auth stack and we use middleware protcetion for all app/* routes. User creation is tracked via webhook with a middleware fallback.

### Trip Creation
From our homepage our the /app/rent/searches users may begin a trip by setting dates of at lease one month and a location with a lat long. They may be logged in or not logged in.

#### Not Logged in
Users will see a mimic of our app/rent/searches route but instead at guest/rent/searches. They will not be able to apply to listings without signing in. Upon sign in they will be redirected to app/rent/searches/[tripId] using a Server side check against the guest session database oject we use to track behavior in /guest/rent/searches


#### Search Views
The views we maintain are 'All Listings' A view with a grid of search cards and a map. 'Recommended' which is a one at at time detailed view. 'Favorites' which is a grid of listing cards the user has liked, which prompt them to apply. 'Match' is a tab of applied to listing cards in a agrid from which the user can sign a lease and apply.

####
