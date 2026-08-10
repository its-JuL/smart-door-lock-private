async function fetcher(url) {
    startLoader();
    const response = await fetch(url);
    const data = await response.json();
    closeLoader();
    return data;
}

async function setter({
    url,
    body = null,
    successMsg = "Success execute task",
    successBody = "Success execute task",
    failedMsg = "Something Wrong",
    failedBody = "we are sorry can't execute your task",
    method = "POST",
}) {
    startLoader();
    let response;
    if (body) {
        response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
            method,
            body: JSON.stringify(body),
        });
    }

    if (!body) {
        response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            },
            method,
        });
    }
    closeLoader();

    const data = await response.json();
    if (!data.success) {
        showToast({
            theme: "danger",
            title: data.message || failedMsg,
            desc:
                data.data.errors ||
                data.message ||
                data.data.err ||
                data.data.error ||
                failedBody,
        });
        return { success: false, data: data.data };
    }

    if (data.success) {
        showToast({
            theme: "success",
            title: data.message || successMsg,
            desc: successBody,
        });
        return { success: true, data: data.data };
    }
}

async function fileUpload({
    url,
    body = null,
    successMsg = "Success execute task",
    successBody = successMsg,
    failedMsg = "Something Wrong",
    failedBody = "we are sorry can't execute your task",
}) {
    startLoader();
    let response;
    if (body) {
        response = await fetch(url, {
            method: "POST",
            body: body,
        });
    }
    closeLoader();

    const data = await response.json();

    if (!data.success) {
        showToast({
            theme: "danger",
            title: failedMsg,
            desc:
                failedBody ||
                data.data.err ||
                data.data.error ||
                data.data.errors.email.detail ||
                data.data.errors,
        });
        return { success: false, data: data.data };
    }

    if (data.success) {
        showToast({
            theme: "success",
            title: successMsg,
            desc: successBody,
        });
        return { success: true, data: data.data };
    }
}

async function generalDataLoader({ url, func, errHandler = false }) {
    const data = await fetcher(`${url}`);
    if (!data.success) {
        if (errHandler) {
            errHandler(data.data.err || data.data.error || data.data.errors);
        }
        if (!errHandler) {
            showToast({
                theme: "danger",
                title: "Something wrong",
                desc:
                    data.data.err ||
                    data.data.error ||
                    data.data.errors ||
                    data.message,
            });
        }
    }

    if (data.success) {
        func(data.data);
    }
}

function lastCursorFinder(containerClass, attrName) {
    const container = document.querySelectorAll(containerClass);
    const lastCursor = container[container.length - 1].getAttribute(
        `data-${attrName}`
    );
    return lastCursor;
}
