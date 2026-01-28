const pathname = window.location.pathname;

let basePath = pathname;

if (pathname.includes("/frontend")) {
  basePath = pathname.split("/frontend")[0];
} else if (pathname.includes("/backend")) {
  basePath = pathname.split("/backend")[0];
} else {
  basePath = pathname.substring(0, pathname.lastIndexOf("/"));
}

const BASE_URL = window.location.origin + basePath;

window.BASE_URL = BASE_URL;
