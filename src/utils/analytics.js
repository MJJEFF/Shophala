export const trackEvent = (eventName, params = {}) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", eventName, params);
    }
};

// Pre-built events
export const analytics = {
    signup: (method) => trackEvent("sign_up", { method }),
    login: (method) => trackEvent("login", { method }),
    viewStore: (vendorId) => trackEvent("view_store", { vendor_id: vendorId }),
    viewProduct: (productName, price) => trackEvent("view_item", { item_name: productName, value: price, currency: "NGN" }),
    addToCart: (productName, price) => trackEvent("add_to_cart", { item_name: productName, value: price, currency: "NGN" }),
    checkout: (total) => trackEvent("begin_checkout", { value: total, currency: "NGN" }),
    purchase: (total, items) => trackEvent("purchase", { value: total, currency: "NGN", items }),
    upgrade: (plan) => trackEvent("upgrade_plan", { plan_name: plan }),
    addProduct: () => trackEvent("add_product"),
    copyStoreLink: () => trackEvent("copy_store_link"),
    shareProduct: (productName) => trackEvent("share_product", { item_name: productName }),
};