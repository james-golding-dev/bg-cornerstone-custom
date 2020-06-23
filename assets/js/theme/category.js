import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
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

        /** Custom behaviors **/
        $(".page.custom").each(function() {

            configureCustomItemImages(this);
            attachCustomHover(this);

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
