import { hooks, api } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import modalFactory, { showAlertModal } from './global/modal';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';

export default class Category extends CatalogPage {
    onReady() {
        compareProducts(this.context.urls);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        /** Custom page behaviors **/
        $(".page.custom").each(function() {

            configureCustomItemImages(this);
            attachCustomHover(this);
            configureCustomUI();

            // Add a resize listener to re-configure image sources.
            $(window).on("resize", () => configureCustomItemImages(this));
        });
    }

    initFacetedSearch() {
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        });
    }
}

function configureCustomUI() {

    configureAddAll();
    configureRemoveAll();
}

function configureAddAll() {

    $(".add-all").on("click", addAllToCart);
}

function addAllToCart(evt) {

    evt.preventDefault();

    const addAllButt = $(evt.currentTarget);
    const originalBtnVal = addAllButt.text();
    const waitMessage = addAllButt.data('waitMessage');

    let items = this.getAttribute("data-product-ids").split(" ").map(function(x) {

                    return { quantity: 1, productId: parseInt(x) };
                }),
        url = '/api/storefront/carts';

    addAllButt.off("click")
              .text(waitMessage)
              .prop('disabled', true);

    api.cart.getCart({}, (err, response) => {

        if (err) finalize("error");

        else {

            if (response && response.id) url += `/${response.id}/items`;

            $.ajax({
                method: 'POST',
                url: url,
                data: JSON.stringify({ lineItems: items }),
                complete: function (res, status) {

                    finalize(status, res.responseJSON.id);
                }
            });
        }
    });

    function finalize(status, id) {

        const tmp = document.createElement('DIV');

        switch (status) {
            case "success":
                api.cart.getCartQuantity({ cartId: id }, (err, res) => {

                    if (res || res === 0) $('body').trigger('cart-quantity-update', res);
                });

                tmp.innerHTML = "One (1) of each product added to cart";
            break;
            case "error":
                tmp.innerHTML = "Could not add products to cart";
            break;
        }

        addAllButt.text(originalBtnVal)
                  .prop('disabled', false);

        configureCustomUI();
        return showAlertModal(tmp.textContent || tmp.innerText, status);
    }
}

function configureRemoveAll() {

    const removeAll = $(".remove-all");

    api.cart.getCart({}, (err, response) => {

        let lineItemIds = [],
            startCount = 0;
        
        if (!err && response) {

            const cart = response;
            const cartLineItems = [
                    cart.lineItems.physicalItems,
                    cart.lineItems.digitalItems,
                    cart.lineItems.customItems,
                    cart.lineItems.giftCertificates
                ].reduce((a, b) => a.concat(b))
                    .filter(lineItem => !lineItem.parentId)
                    .map(lineItem => lineItem.id);

            lineItemIds.push(...cartLineItems);
        }

        if  (lineItemIds.length > 0) {

            let count = 0,
                startCount = lineItemIds.length;

            removeAll.off("click").on("click", function (evt) {

                evt.preventDefault();

                const rmvButt = $(evt.currentTarget);
                const originalBtnVal = rmvButt.text();
                const waitMessage = rmvButt.data('waitMessage');

                let errorCount = 0;

                rmvButt.off("click")
                       .text(waitMessage)
                       .prop('disabled', true);

                lineItemIds.forEach(function(x, i) {

                    api.cart.itemRemove(x, (err, res) => {

                        if (err) errorCount += 1;
                        count += 1;

                        if (count === lineItemIds.length) {

                            const tmp = document.createElement('DIV');

                            let status;

                            if (errorCount > 0) {

                                status = "error";
                                tmp.innerHTML = "Could not remove all products from cart";

                            } else {

                                status = "success";
                                tmp.innerHTML = "All products removed from cart";
                            }

                            rmvButt.text(originalBtnVal)
                                   .prop('disabled', false);

                            configureRemoveAll();
                            $('body').trigger('cart-quantity-update', (startCount-count));
                            return showAlertModal(tmp.textContent || tmp.innerText, status);
                        }
                    });
                });

            }).css({ display: "inline-block" });

        } else removeAll.off("click").hide();
    });
}

function attachCustomHover(page) {
    $(page).off("mouseover", customItemHover)
           .on("mouseover", ".listItem-image", customItemHover);
}

function removeCustomHover(page) {

    $(page).off("mouseover", customItemHover);
}

function customItemHover(evt) {

    let delTarg = evt.delegateTarget,
        currTarg = $(evt.currentTarget);

    removeCustomHover(delTarg);
    currTarg.on("mouseleave", resetImg);

    let currSrc = currTarg[0].currentSrc,
        imgs = currTarg.data("hovImgs"),
        idx = 0,
        imgSetting = true,
        imgSetter,
        imgProm;

    setImg();

    function imgLoadPromise(domImg, src, srcset) {

        return new Promise((resolve, reject) => {

            let img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;
            domImg[0].srcset = img.srcset = srcset;
            domImg[0].src = img.src = src;
        });
    }

    function setImg() {

        let src, srcset;

        if (idx === imgs.length) {
            
            src = currSrc;
            srcset = currTarg.data("srcset");

        } else {
            
            src = imgs[idx][0];
            srcset = imgs[idx].slice(1).join(", ");
        }

        currTarg.animate({ "opacity": 0 }, 200).promise().done(function() {
            imgLoadPromise(currTarg, src, srcset)
            .then((img) => {
                if (imgSetting) {
                    currTarg.animate({ "opacity": 1 }, 200).promise().done(function() {
                        idx = (idx + 1) % (imgs.length + 1);
                        imgSetter = setTimeout(setImg, 2000);
                    });
                } else resetImg();
            });
        });
    }

    function resetImg() {

        imgSetting = false;
        clearTimeout(imgSetter);
        currTarg.off("mouseleave", resetImg);
        imgLoadPromise(currTarg, currSrc, currTarg.data("srcset"))
                .then((img) => {
                    currTarg.css({ "opacity": 1 });
                    attachCustomHover(delTarg);
                });
    }
}

function configureCustomItemImages(page) {

    $(".listItem-image", $(page)).each(function () {

        let srcSets = this.getAttribute("data-hover-srcset").split("srcset="),
            hovImgs = [];

        srcSets.forEach((x) => {

            if (x.length) hovImgs.push(x.split(", "));
        });

        $(this).data("hovImgs", hovImgs);
    });
}