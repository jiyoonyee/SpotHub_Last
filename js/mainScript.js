let latitude = null;
let longitude = null;
let freindsLa = null;
let freindsLO = null;
let nowSi = null;
let nowGu = null;
let searchFlag = false;
let openInput = false;
let savePageOpen = false;

let map;
let marker = null; // 사용자 위치 마커
let friendMarker = null; // 친구 위치 마커
let middleMarker = null; // 중간 위치 마커

let friendInfoWindow = null; // 친구 위치 말풍선
let middleInfoWindow = null; // 중간 위치 말풍선

var geocoder = new kakao.maps.services.Geocoder();
infowindow = new kakao.maps.InfoWindow({ zindex: 1 });

// 커스텀 오버레이와 마커 배열 선언
var placeOverlay = new kakao.maps.CustomOverlay({ zIndex: 1 }),
  contentNode = document.createElement("div"),
  markers = [],
  currCategory = "";

// 초기 설정
contentNode.className = "placeinfo_wrap";
placeOverlay.setContent(contentNode);

// 지도 설정
const geoOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

const calculateMiddleLocation = () => {
  if (
    latitude !== null &&
    longitude !== null &&
    freindsLa !== null &&
    freindsLO !== null
  ) {
    const middleLatitude = (latitude + freindsLO) / 2;
    const middleLongitude = (longitude + freindsLa) / 2;
    const middlePosition = new kakao.maps.LatLng(
      middleLatitude,
      middleLongitude
    );

    if (middleMarker) {
      middleMarker.setMap(null);
      if (middleInfoWindow) middleInfoWindow.close();
    }

    middleMarker = new kakao.maps.Marker({
      position: middlePosition,
      map: map,
    });

    middleInfoWindow = new kakao.maps.InfoWindow({
      content:
        '<div style="width:150px;text-align:center;padding:6px 0;">중간 위치</div>',
    });
    middleInfoWindow.open(map, middleMarker);

    map.setCenter(middlePosition);
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);
  } else {
    console.warn("위치 정보가 부족하여 중간 위치를 계산할 수 없습니다.");
  }
};

const loadLocaion = (si, gu) => {
  const getSi = document.querySelector("#si");
  const getGu = document.querySelector("#gu");
  if (searchFlag) {
    if (nowSi != si && nowSi != null) {
      getSi.style.transition = "none";
      getSi.style.opacity = 0;
    }
    if (nowGu != gu && nowGu != null) {
      getGu.style.transition = "none";
      getGu.style.opacity = 0;
    }
  }

  setTimeout(() => {
    getSi.style.transition = "all 1s ease-in-out";
    document.querySelector("#si").style.opacity = 1;
  }, 500);
  setTimeout(() => {
    getGu.style.transition = "all 1s ease-in-out";
    document.querySelector("#gu").style.opacity = 1;
  }, 700);
};

const success = (position) => {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;

  const container = document.querySelector("#map");
  const options = {
    center: new kakao.maps.LatLng(latitude, longitude),
    level: 3,
  };

  map = new kakao.maps.Map(container, options);

  const markerPosition = new kakao.maps.LatLng(latitude, longitude);

  if (!marker) {
    marker = new kakao.maps.Marker({ position: markerPosition });
    marker.setMap(map);

    const infowindow = new kakao.maps.InfoWindow({
      content:
        '<div style="width:150px;text-align:center;padding:6px 0;">내 위치</div>',
    });
    infowindow.open(map, marker);
  }

  kakao.maps.event.addListener(map, "idle", function () {
    searchAddrFromCoords(map.getCenter(), displayCenterInfo);
    searchPlaces();
  });

  searchAddrFromCoords(map.getCenter(), displayCenterInfo);

  document.querySelector(".inputSearchButton").addEventListener("click", () => {
    const inputWrap = document.querySelector(".locationInput");
    inputWrap.focus();

    if (!openInput) {
      inputWrap.setAttribute(
        "style",
        "width:100%; background: rgba(255, 255, 255, 0.59);"
      );
      inputWrap.classList.add("open");
      openInput = !openInput;
    }

    if (inputWrap.classList.contains("open")) {
      searchFlag = !searchFlag;
      geocoder.addressSearch(
        document.querySelector(".locationInput").value,
        function (result, status) {
          if (status === kakao.maps.services.Status.OK) {
            const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
            freindsLO = coords.Ma;
            freindsLa = coords.La;

            if (friendMarker) {
              friendMarker.setMap(null);
              if (friendInfoWindow) friendInfoWindow.close();
            }

            friendMarker = new kakao.maps.Marker({
              map: map,
              position: coords,
            });

            friendInfoWindow = new kakao.maps.InfoWindow({
              content:
                '<div style="width:150px;text-align:center;padding:6px 0;">내 친구의 위치</div>',
            });
            friendInfoWindow.open(map, friendMarker);

            map.setCenter(coords);
            searchAddrFromCoords(map.getCenter(), displayCenterInfo);
          }
        }
      );
      setTimeout(() => {
        searchFlag = !searchFlag;
      }, 1000);
    }
  });

  document.querySelector("#searchLink").addEventListener("click", () => {
    setTimeout(() => {
      calculateMiddleLocation();
    }, 1000);
  });
};

const error = (err) => {
  console.warn("ERROR(" + err.code + "): " + err.message);
};

const searchAddrFromCoords = (coords, callback) => {
  geocoder.coord2RegionCode(coords.getLng(), coords.getLat(), callback);
};

const displayCenterInfo = (result, status) => {
  if (status === kakao.maps.services.Status.OK) {
    for (let i = 0; i < result.length; i++) {
      if (result[i].region_type === "H") {
        loadLocaion(
          result[i].address_name.split(" ")[0],
          result[i].address_name.split(" ")[1]
        );

        nowSi = result[i].address_name.split(" ")[0];
        nowGu = result[i].address_name.split(" ")[1];

        document.querySelector("#si").textContent = nowSi;
        document.querySelector("#gu").textContent = nowGu;
        break;
      }
    }
  }
};

// 카테고리별 검색
function searchPlaces() {
  if (!currCategory) {
    return;
  }
  placeOverlay.setMap(null);
  removeMarker();
  const ps = new kakao.maps.services.Places(map);
  ps.categorySearch(currCategory, placesSearchCB, { useMapBounds: true });
}

function placesSearchCB(data, status, pagination) {
  if (status === kakao.maps.services.Status.OK) {
    displayPlaces(data);
  }
}

function displayPlaces(places) {
  const order = document
    .getElementById(currCategory)
    .getAttribute("data-order");
  const placeinfoWrap = document.querySelector(".placeinfoWrap"); // placeinfoWrap 요소 가져오기

  placeinfoWrap.innerHTML = ""; // 이전 결과 초기화

  for (let i = 0; i < places.length; i++) {
    // 마커 추가
    const marker = addMarker(
      new kakao.maps.LatLng(places[i].y, places[i].x),
      order
    );
    (function (marker, place) {
      kakao.maps.event.addListener(marker, "click", function () {
        displayPlaceInfo(place);
      });
    })(marker, places[i]);

    // 장소 정보 생성 및 추가
    const placeInfoDiv = document.createElement("div");
    placeInfoDiv.className = "placeinfo";

    const titleLink = document.createElement("a");
    titleLink.className = "title";
    titleLink.href = places[i].place_url;
    titleLink.target = "_blank";
    titleLink.textContent = places[i].place_name;
    placeInfoDiv.appendChild(titleLink);

    const addressSpan = document.createElement("i");
    addressSpan.className = "fa-solid fa-chevron-right";

    placeInfoDiv.appendChild(addressSpan);

    placeinfoWrap.appendChild(placeInfoDiv); // placeinfoWrap에 추가
  }
}

function addMarker(position, order) {
  // const imageSrc =
  //     "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/places_category.png",
  const imageSrc = "../img/heart.png",
    imageSize = new kakao.maps.Size(27, 28),
    imgOptions = {
      spriteSize: new kakao.maps.Size(50, 50),
      spriteOrigin: new kakao.maps.Point(45),
      offset: new kakao.maps.Point(-11, 28),
    },
    markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
    marker = new kakao.maps.Marker({
      position: position,
      image: markerImage,
    });
  marker.setMap(map);
  markers.push(marker);

  return marker;
}

function removeMarker() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}
let placeInfoClone = document.querySelector(".placeinfo").cloneNode(true);
function displayPlaceInfo(place) {
  // const content = `
  // <a class="placeinfoOnMap" href="${place.place_url}">
  //   <p class="title"  target="_blank">${place.place_name}</p>
  //   <i class="fa-solid fa-chevron-right"></i>
  // </a>`;

  document.querySelector(".placeinfoOnMap").href = place.place_url;
  document.querySelector(".placeinfoOnMap>p").textContent = place.place_name;
  // contentNode.innerHTML = content;
  // placeOverlay.setPosition(new kakao.maps.LatLng(place.y, place.x));
  // placeOverlay.setMap(map);
}

function addCategoryClickEvent() {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].onclick = onClickCategory;
  }
}

function onClickCategory() {
  placeOverlay.setMap(null);
  if (this.className === "on") {
    currCategory = "";
    changeCategoryClass();
    removeMarker();
  } else {
    currCategory = this.id;
    changeCategoryClass(this);
    searchPlaces();
  }
}

function changeCategoryClass(el) {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].classList.remove("on");
  }
  if (el) {
    el.classList.add("on");
  }
}

function changeCategoryClassInfo(el) {
  const category = document.getElementById("category").children;
  for (let i = 0; i < category.length; i++) {
    category[i].classList.remove("on");
  }
  if (el) {
    el.classList.add("on");
  }
}

navigator.geolocation.getCurrentPosition(success, error, geoOptions);

loadLocaion();

document.querySelector("#map").addEventListener("click", () => {
  const inputWrap = document.querySelector(".locationInput");
  inputWrap.setAttribute(
    "style",
    "width:0%; background: rgba(255, 255, 255, 0.59);"
  );
  inputWrap.blur();
  openInput = !openInput;
});

document.querySelector("#saveLink").addEventListener("click", () => {
  const savePage = document.querySelector(".selectedSpot");

  if (!savePageOpen) {
    savePage.setAttribute("style", "transform: translateX(0%);");
    savePageOpen = !savePageOpen;
    console.log(markers);
  }
});

document.querySelector(".closeButton").addEventListener("click", (e) => {
  document
    .querySelector(".selectedSpot")
    .setAttribute("style", "transform: translateX(-100%);");
  savePageOpen = !savePageOpen;
});

// 우편번호 찾기 찾기 화면을 넣을 element
var element_wrap = document.querySelector(".locationSearch");

function foldDaumPostcode() {
  // iframe을 넣은 element를 안보이게 한다.
  element_wrap.style.display = "none";
}

function sample3_execDaumPostcode() {
  // 현재 scroll 위치를 저장해놓는다.
  var currentScroll = Math.max(
    document.body.scrollTop,
    document.documentElement.scrollTop
  );
  new daum.Postcode({
    oncomplete: function (data) {
      console.log(document.documentElement);
      // 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

      // 각 주소의 노출 규칙에 따라 주소를 조합한다.
      // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
      var addr = ""; // 주소 변수
      var extraAddr = ""; // 참고항목 변수

      //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
      if (data.userSelectedType === "R") {
        // 사용자가 도로명 주소를 선택했을 경우
        addr = data.roadAddress;
      } else {
        // 사용자가 지번 주소를 선택했을 경우(J)
        addr = data.jibunAddress;
      }

      // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
      if (data.userSelectedType === "R") {
        // 법정동명이 있을 경우 추가한다. (법정리는 제외)
        // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
        if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
          extraAddr += data.bname;
        }
        // 건물명이 있고, 공동주택일 경우 추가한다.
        if (data.buildingName !== "" && data.apartment === "Y") {
          extraAddr +=
            extraAddr !== "" ? ", " + data.buildingName : data.buildingName;
        }
        // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
        if (extraAddr !== "") {
          extraAddr = " (" + extraAddr + ")";
        }
      }

      // 우편번호와 주소 정보를 해당 필드에 넣는다.
      document.querySelector(".locationInput").value = addr;

      // iframe을 넣은 element를 안보이게 한다.
      // (autoClose:false 기능을 이용한다면, 아래 코드를 제거해야 화면에서 사라지지 않는다.)
      document.querySelector(".searchPopup").style.display = "none";

      // 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
      document.body.scrollTop = currentScroll;
    },
    // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
    onresize: function (size) {
      // element_wrap.style.height = size.height + "px";
    },
    width: "100%",
    height: "100%",
  }).embed(element_wrap);

  // iframe을 넣은 element를 보이게 한다.
  element_wrap.style.display = "block";
}

document.querySelector(".locationInput").addEventListener("click", () => {
  document.querySelector(".searchPopup").style.display = "flex";
  sample3_execDaumPostcode();
});

document.querySelector(".searchPopup").addEventListener("click", (e) => {
  e.target.style.display = "none";
});

addCategoryClickEvent(); // 카테고리 클릭 이벤트 초기화
