var readyStateCheckInterval_Products = setInterval(function () {
    if (document.readyState === "complete" && window.location.pathname == "/products") {
        clearInterval(readyStateCheckInterval_Products);
        $('#searchProduct').keypress(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13') {
                loadProducts($("#searchProduct").val());
            }
        });
        loadProducts();
    }
}, 10);

function loadProducts(data = "") {
    var post_data = JSON.stringify({ "srch_key": data });
    var template_product_card = document.getElementById("productCard");
    var template_product_brand = document.getElementById("productBrandTable");
    var counter = 0;
    var counter_sq = 0;

    $("#productTable").empty();
    $("#infoProduct").empty();
    $.ajax({
        type: "POST",
        url: "/api/product/search",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            if (data["data"].length != 0) {
                data["data"].forEach((product_card) => {
                    var clone_product_card = template_product_card.content.cloneNode(true);
                    var contentId = "productBrandTable-" + counter;
                    var price = "$ " + currencyFormat(product_card["price"]);

                    clone_product_card.querySelector("#productBrandTable").id = contentId;
                    clone_product_card.querySelector("#producerName").innerHTML = product_card["producer_name"];
                    clone_product_card.querySelector("#productName").innerHTML = product_card["product_name"];
                    clone_product_card.querySelector("#productPrice").innerHTML = price;

                    counter += 1;
                    counter_sq = 0;

                    $("#productTable").append(clone_product_card);
                    product_card["product_table"].forEach((product_table) => {
                        var clone_product_brand = template_product_brand.content.cloneNode(true);

                        clone_product_brand.querySelector("#brandName").innerHTML = product_table["color"];
                        clone_product_brand.querySelector("#quantity").innerHTML = product_table["quantity"];
                        clone_product_brand.querySelector("#editBtn").href = "javascript:submitEdit_winProduct(" + (counter - 1) + "," + counter_sq + ")";

                        counter_sq += 1;
                        $('#' + contentId).append(clone_product_brand);

                    });
                });
                new_modal();
            } else {
                $("#infoProduct").append('<br><i class="pt-5 d-flex justify-content-center ion ion-md-happy" style="font-size: 48px;"></i>');
                $("#infoProduct").append('<a class="pt-2 d-flex justify-content-center">Wow! Such empty<a>');
            }



        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}

function currencyFormat(num) {
    return (
        num
            .toFixed(0)
            .replace('.', ',')
            .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    )
}

function new_modal() {
    $('.modal-body #categoryInput').empty().append(new Option("Category", 0));
    $('.modal-body #categoryInput option[value="0"]').attr('selected', true);
    $('.modal-body #categoryInput option[value="0"]').attr('disabled', true);

    var post_data = JSON.stringify({ "srch_key": "" });
    $.ajax({
        type: "POST",
        url: "/api/producer/search",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            data["data"].forEach(category => {
                $('.modal-body #categoryInput').append(new Option(category["producer_name"], category["producer_id"]));
            });
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}

function newProduct_modal() {
    $('div[id$="Errors"]').remove();
    $('[id$="Input"]').removeClass().addClass('form-control');
    $('.modal-footer #submitBtn').off('click').on("click", submitCreate_winProduct);
    $('.modal-body #modalTitle').text("New Product");
    $('.modal-body #brand_nameInput').val("");
    $('.modal-body #brand_nameInput').removeAttr("disabled");
    $('.modal-body #barcodeInput').val("");
    $(".modal-body #categoryInput option").removeAttr('selected');
    $('.modal-body #categoryInput option[value=0]').attr('selected', 'selected');
    $('.modal-body #nameInput').val("");
    $('.modal-body #priceInput').val("");
    $('.modal-body #quantityInput').val("");
    $('.modal-footer #deleteBtn').hide();
    $("#productModal").modal("show");
}

function submitEdit_winProduct(brand_id, edit_id) {
    post_data = JSON.stringify({
        "brand_id": brand_id,
        "edit_id": edit_id
    });

    $.ajax({
        type: "POST",
        url: "/api/product/edit",
        data: post_data,
        contentType: 'application/json',
        success: function (data) {
            $('div[id$="Errors"]').remove();
            $('[id$="Input"]').removeClass().addClass('form-control');
            $('.modal-footer #submitBtn').off('click').on("click", { product_id: data["data"][0]["product_table"][0]["product_id"] }, submitUpdate_winProduct);
            $('.modal-footer #deleteBtn').off('click').on("click", { product_id: data["data"][0]["product_table"][0]["product_id"] }, submitDelete_winProduct);
            $('.modal-body #modalTitle').text("Edit Product");
            $('.modal-body #brand_nameInput').val(data["data"][0]["product_table"][0]["color"]);
            $('.modal-body #barcodeInput').val(data["data"][0]["product_table"][0]["barcode"]);
            $('.modal-body #categoryInput option').eq(0).removeAttr('selected');
            $('.modal-body #categoryInput option[value=' + data["data"][0]["producer_id"] + ']').attr('selected', 'selected');
            $('.modal-body #nameInput').val(data["data"][0]["product_name"]);
            $('.modal-body #priceInput').val(data["data"][0]["price"]);
            $('.modal-body #quantityInput').val(data["data"][0]["product_table"][0]["quantity"]);
            $('.modal-body #brand_nameInput').attr('disabled', true);
            $('.modal-footer #deleteBtn').show();
            $("#productModal").modal("show")

        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
        }
    });
}

function submitUpdate_winProduct(event) {
    $('#product_id').val(event.data.product_id);
    $('#brand_nameInput').removeAttr("disabled");
    $.ajax({
        type: "POST",
        url: '/api/product/update',
        data: $('form').serialize(),
        success: function (data) {
            console.log(data);
        }
    });

    $('#productModal').modal('hide');
    window.location.reload(true); 
}

function submitCreate_winProduct() {
    $.ajax({
        type: "POST",
        url: '/api/product/create',
        data: $('form').serialize(),
        success: function (data) {
            if (data.data.message) {
                $('#productModal').modal('hide');
                window.location.reload(true); 
            } else {
                console.log(data);
                data.fields.forEach(key => {
                    $('#' + key + 'Errors').remove();
                    if (key in data.data) {
                        $('#' + key + 'Input').removeClass().addClass('form-control is-invalid');
                        $('#' + key + 'Class').append('<div id="' + key + 'Errors" class="invalid-feedback"></div>');
                        data.data[key].forEach(error => {
                            $('#' + key + 'Errors').append('<span>' + error + '</span>');
                        });
                    } else {
                        $('#' + key + 'Input').removeClass().addClass('form-control');
                    }
                });
            }
        }
    });
}

function submitDelete_winProduct(event) {
    $('#product_id').val(event.data.product_id);
    $('#brand_nameInput').removeAttr("disabled");
    console.log($('form').serialize());
    $.ajax({
        type: "POST",
        url: '/api/product/delete',
        data: $('form').serialize(),
        success: function (data) {
            console.log(data);
        }
    });

    $('#productModal').modal('hide');
    window.location.reload(true); 
}