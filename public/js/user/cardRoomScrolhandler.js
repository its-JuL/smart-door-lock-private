const slider = document.querySelector(".building-filter");
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.style.cursor = "grabbing";
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});
slider.addEventListener("mouseleave", () => {
    slider.style.cursor = "grab";
    isDown = false;
});
slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.style.cursor = "grab";
});
slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    slider.style.cursor = "grabbing";
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1; //scroll-fast
    slider.scrollLeft = scrollLeft - walk;
});
