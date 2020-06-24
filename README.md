# Custom Cornerstone Test

### Task List
1. Create a product called Special Item which will be assigned to a new category called Special Items. Be sure to add at least 2 images during the product creation
2. Create a custom template for the Special Items category page (you may need to restart the CLI to see the custom template after creating it). 
3. The Special Item should be the only item which shows in this category - create a feature that will show the product's second image when it is hovered on.
4. Add a button at the top of the category page labeled Add All To Cart. When clicked, the product will be added to the cart. Notify the user that the product has been added. 
5. If the cart has an item in it - show a button next to the Add All To Cart button which says Remove All Items. When clicked it should clear the cart and notify the user.
6. Both buttons should utilize the Storefront API for completion.
7. If a customer is logged in - at the top of the category page show a banner that shows some customer details (i.e. name, email, phone ,etc). This should utilize the data that is rendered via Handlebars on the Customer Object.

### Outcomes
1-2. Custom template created for Special Items category, with custom components for listing.  
3. Image mouseover results in a cycling of the product's images, setting source and srcset within promises. A list view is used for the custom listing, instead of a card view, so product action buttons do not clash with this custom behavior.  
4&6. "Add all to Cart" button implemented for the Special Items category page. All product IDs of the category are queried by the Cart API via an AJAX call, with one of each added to the cart. A modal notification is used for success and error.  
5&6. "Remove All Items" button implemented for the Special Items category page. This button is dynamically added/removed depending upon cart status, with products removed via AJAX calls to the Cart API. A modal notification is used for success and error.  
7. A logged-in customer has their details displayed above the page breadcrumbs, with an option to sign out.  

### Store URL
https://customtest.mybigcommerce.com/

### Preview Code
y2hdn3oo3j
