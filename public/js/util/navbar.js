const navbarToggller = document.querySelector("#nav--toggle");
const navbarTarget = document.querySelector("#target--nav");
let navbarHasOpen = false;
navbarToggller.addEventListener("click", () => {
    navbarTarget.classList.toggle("nav--open");
    navbarHasOpen
        ? (navbarToggller.src = "/image/icon_layers.svg")
        : (navbarToggller.src = "/image/icon_close.svg");
    navbarHasOpen = !navbarHasOpen;
});
