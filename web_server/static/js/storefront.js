var typingTimer;
var doneTypingInterval = 500;

var readyStateCheckInterval_Storefront = setInterval(function () {
    if (document.readyState === "complete" && window.location.pathname == "/storefront") {
        clearInterval(readyStateCheckInterval_Storefront);
        searchBarListener();

        $('#productSearchBtn').on('click', function () {
            loadExistingProducts($("#productSearchBar").val());
        });
        $('#newOrder').on('click', function () {
            $('#productTable').empty();
            $("#productSearchBar").val("");
            $.ajax({
                type: "POST",
                url: "/api/storefront/product/reset",
                contentType: 'application/json',
                success: function (data) {
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log("Status: " + textStatus);
                    console.log("Error: " + errorThrown);
                }
            });
            $('#inputProductSelect').empty();
            $('#inputProductSelect').append(new Option("Choose...", 0));
        });
        $('#clearBtn').on('click', function () {
            $("#productSearchBar").val("");
        });
    }
}, 10);

function loadExistingProducts(data) {
    var post_data = JSON.stringify({ "srch_key": data });
    $.ajax({
        type: "POST",
        url: "/api/storefront/search",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            $('#inputProductSelect').empty();
            if (data["data"].length != 0) {
                data["data"].forEach(category => {
                    $('#inputProductSelect').append(new Option(category["producer_name"] + ": " + category["product_name"], category["product_table"][0]["product_id"]));
                });

                $('#addBtn').off('click').on('click', { product_data: data }, loadProductCard);
                $('#productSearchBar').off('keyup').on('keyup', { product_data: data }, introKeyPressed);
                searchBarListener();
            } else {
                $('#inputProductSelect').append(new Option("Choose...", 0));
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}

function doneTyping() {
    loadExistingProducts($("#productSearchBar").val());

}

function searchBarListener() {
    $('#productSearchBar').keyup(function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    $('#productSearchBar').keydown(function () {
        clearTimeout(typingTimer);
    });
}

function introKeyPressed(event) {
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
        loadProductCard(event);
    }
}

function loadProductCard(event) {
    var product_id = parseInt($('#inputProductSelect').children("option:selected").val(), 10);
    var template_product_card = document.getElementById("productCard");
    event.data.product_data["data"].forEach(product => {
        if (product["product_table"][0]["product_id"] == product_id) {
            price = product["price"];
        }
    });
    if (product_id != 0) {
        var post_data = JSON.stringify({ "product_id": product_id, "price": price });

        $.ajax({
            type: "POST",
            url: "/api/storefront/product/add",
            data: post_data,
            contentType: 'application/json',
            success: function (data) {
                if (data["data"]) {
                    event.data.product_data["data"].forEach(product => {
                        if (product["product_table"][0]["product_id"] == product_id && product["product_table"][0]["quantity"] != 0) {
                            var price = "$ " + currencyFormat(product["price"]);
                            var clone_product_card = template_product_card.content.cloneNode(true);
                            var contentId = "productClassId-" + product_id;
                            clone_product_card.querySelector("#productClassId").id = contentId;
                            clone_product_card.querySelector("#producerName").innerHTML = product["producer_name"];
                            clone_product_card.querySelector("#productName").innerHTML = product["product_name"];
                            clone_product_card.querySelector("#productPrice").innerHTML = price;
                            clone_product_card.querySelector("#productPrice").id = "productPrice-" + product_id;
                            clone_product_card.querySelector("#productBrandName").innerHTML = product["product_table"][0]["color"];
                            clone_product_card.querySelector("#numberSelect").id = "numberSelect-" + product_id;
                            clone_product_card.querySelector("#clearBtn").href = "javascript:submitDelete_winStorefront(" + product_id + ")";
                            $("#productTable").append(clone_product_card);
                            $("#numberSelect-" + product_id).attr({ "max": product["product_table"][0]["quantity"], "min": 1 });
                            $("#numberSelect-" + product_id).change({ price: product["price"], product_id: product_id }, setProductPrices);
                            updateFinalPrice(product_id);
                        } else if(product["product_table"][0]["product_id"] == product_id && product["product_table"][0]["quantity"] == 0){
                            var asd = JSON.stringify({ "product_id": product_id });
                            $.ajax({
                                type: "POST",
                                url: "/api/storefront/product/remove",
                                data: asd,
                                contentType: 'application/json',
                                success: function (data) {
                                },
                                error: function (XMLHttpRequest, textStatus, errorThrown) {
                                    console.log("Status: " + textStatus);
                                    console.log("Error: " + errorThrown);
                                }
                            });

                        }
                    });
                    $("input[id=numberSelect-" + product_id + "]").inputSpinner();
                    $("#productSearchBar").val("");
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            }
        });
    }
}

function updateFinalPrice(product_id, quantity = 1) {
    var total_price = 0;
    var post_data = JSON.stringify({ "product_id": product_id, "quantity": quantity });
    $.ajax({
        type: "POST",
        url: "/api/storefront/product/update",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            console.log(data);
            data["data"].forEach(element => {
                total_price += element["price"] * element["quantity"];
            });
            $('#totalPrice').html("Total: $" + currencyFormat(total_price));
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}

function setProductPrices(event) {
    var quantity = parseInt($("#numberSelect-" + event.data.product_id).val(), 10);
    var final_price = parseInt(event.data.price, 10) * quantity;
    $("#productPrice-" + event.data.product_id).html("$ " + currencyFormat(final_price));
    updateFinalPrice(event.data.product_id, quantity);
}

function submitDelete_winStorefront(val) {
    var post_data = JSON.stringify({ "product_id": val });
    $.ajax({
        type: "POST",
        url: "/api/storefront/product/remove",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            $('#productClassId-' + val).remove();
            updateFinalPrice(val, quantity);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });

}

function submitSave_winStorefront() {
    var date = $('#datepicker').val();
    var hour = $('#hourpicker').val();

    var newdate = date.split("/").reverse().join("-");

    console.log(date, hour);
    var post_data = JSON.stringify({ "date_created": newdate, "hour_created": hour });
    $.ajax({
        type: "POST",
        url: "/api/storefront/save",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            $('#exampleModalCenter').modal('hide');
            window.location.reload(true);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}