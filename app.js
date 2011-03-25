App = function() {

var BLOCK_SIZE = 8;
var coefficients = 8;
var img;
var canvas = [];
var ctx = [];
var imgdata = [];
var dct_matrix = [];

function main() {
    init_dct_matrix(BLOCK_SIZE);

    canvas[0] = document.getElementById("canvas_input");
    canvas[1] = document.getElementById("canvas_intermediate");
    canvas[2] = document.getElementById("canvas_output");

    ctx[0] = canvas[0].getContext("2d");
    ctx[1] = canvas[1].getContext("2d");
    ctx[2] = canvas[2].getContext("2d");

    img = new Image();
    img.onload = function() {
        ctx[0].drawImage(img, 0, 0, img.width, img.height);

        imgdata[0] = ctx[0].getImageData(0, 0, 256, 256);
        imgdata[1] = ctx[1].createImageData(256, 256);
        imgdata[2] = ctx[2].createImageData(256, 256);

        // forward DCT
        fdct(imgdata[0].data, imgdata[1].data, 256, 256);

        // draw second image
        ctx[1].putImageData(imgdata[1], 0, 0);

        // inverse DCT
        idct(imgdata[1].data, imgdata[2].data, 256, 256, coefficients);

        // draw third image
        ctx[2].putImageData(imgdata[2], 0, 0);
    }
    img.src = "cat-256.png";
}

function onchanged_image(value) {
    img.src = value;
}

function onchanged_coefficients(value) {
    coefficients = value;
    img.onload();
}

function copy_imagedata(src, dst, width, height) {
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var offset = (y * width + x) * 4;
            dst[offset + 0] = src[offset + 0];
            dst[offset + 1] = src[offset + 1];
            dst[offset + 2] = src[offset + 2];
            dst[offset + 3] = src[offset + 3];
        }
    }
}

function grayscale(src, dst, width, height) {
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var offset = (y * width + x) * 4;

            var r = src[offset + 0];
            var g = src[offset + 1];
            var b = src[offset + 2];
            var v = parseInt(r * 0.2126 + g * 0.7152 + b * 0.0722);

            dst[offset + 0] = v;
            dst[offset + 1] = v;
            dst[offset + 2] = v;
        }
    }
}

function init_dct_matrix(size) {
    for (var k = 0; k < size; k++) {
        var tk = k * Math.PI / size;

        dct_matrix[k] = [];
        for (var x = 0; x < size; x++) {
            dct_matrix[k][x] = Math.cos(tk * (x + 0.5));
        }    
    }
}

function fdct(src, dst, width, height) {
    var temp = []; // BLOCK_SIZE x BLOCK_SIZE
    var acc = [];

    // src and dst buffer have block aligned size
    for (var y_block_offset = 0; y_block_offset < height; y_block_offset += BLOCK_SIZE) {
        for (var x_block_offset = 0; x_block_offset < width; x_block_offset += BLOCK_SIZE) {
            for (var y = 0; y < BLOCK_SIZE; y++) {
                for (var k = 0; k < BLOCK_SIZE; k++) {
                    var dst_offset = ((y_block_offset + y) * width + x_block_offset + k) * 4;
                    temp[dst_offset + 0] = 0;
                    temp[dst_offset + 1] = 0;
                    temp[dst_offset + 2] = 0;

                    for (var x = 0; x < BLOCK_SIZE; x++) {
                        var src_offset = ((y_block_offset + y) * width + x_block_offset + x) * 4;
                        temp[dst_offset + 0] += (src[src_offset + 0] - 128) * dct_matrix[k][x];
                        temp[dst_offset + 1] += (src[src_offset + 1] - 128) * dct_matrix[k][x];
                        temp[dst_offset + 2] += (src[src_offset + 2] - 128) * dct_matrix[k][x];
                    }

                    var uk = (k == 0 ? 1 : 2) / BLOCK_SIZE;
                    temp[dst_offset + 0] *= uk;
                    temp[dst_offset + 1] *= uk;
                    temp[dst_offset + 2] *= uk;
                }            
            }

            for (var x = 0; x < BLOCK_SIZE; x++) {
                for (var k = 0; k < BLOCK_SIZE; k++) {
                    var dst_offset = ((y_block_offset + k) * width + x_block_offset + x) * 4;
                    acc[0] = 0;
                    acc[1] = 0;
                    acc[2] = 0;

                    for (var y = 0; y < BLOCK_SIZE; y++) {
                        var src_offset = ((y_block_offset + y) * width + x_block_offset + x) * 4;
                        acc[0] += temp[src_offset + 0] * dct_matrix[k][y];
                        acc[1] += temp[src_offset + 1] * dct_matrix[k][y];
                        acc[2] += temp[src_offset + 2] * dct_matrix[k][y];
                    }

                    var uk = (k == 0 ? 1 : 2) / BLOCK_SIZE;
                    acc[0] = acc[0] * uk;
                    acc[1] = acc[1] * uk;
                    acc[2] = acc[2] * uk;

                    dst[dst_offset + 0] = acc[0] + 128;
                    dst[dst_offset + 1] = acc[1] + 128;
                    dst[dst_offset + 2] = acc[2] + 128;
                    dst[dst_offset + 3] = 255;
                }
            }
        }
    }
}

function idct(src, dst, width, height, num_coeff) {
    var temp = []; // BLOCK_SIZE x BLOCK_SIZE
    var acc = [];

    for (var y_block_offset = 0; y_block_offset < height; y_block_offset += BLOCK_SIZE) {
        for (var x_block_offset = 0; x_block_offset < width; x_block_offset += BLOCK_SIZE) {
            for (var x = 0; x < BLOCK_SIZE; x++) {
                for (var k = 0; k < BLOCK_SIZE; k++) {
                    var dst_offset = ((y_block_offset + k) * width + x_block_offset + x) * 4;
                    temp[dst_offset + 0] = 0;
                    temp[dst_offset + 1] = 0;
                    temp[dst_offset + 2] = 0;

                    for (var y = 0; y < num_coeff; y++) {
                        var src_offset = ((y_block_offset + y) * width + x_block_offset + x) * 4;
                        temp[dst_offset + 0] += (src[src_offset + 0] - 128) * dct_matrix[y][k];
                        temp[dst_offset + 1] += (src[src_offset + 1] - 128) * dct_matrix[y][k];
                        temp[dst_offset + 2] += (src[src_offset + 2] - 128) * dct_matrix[y][k];
                    }
                }
            }

            for (var y = 0; y < BLOCK_SIZE; y++) {
                for (var k = 0; k < BLOCK_SIZE; k++) {
                    var dst_offset = ((y_block_offset + y) * width + x_block_offset + k) * 4;
                    acc[0] = 0;
                    acc[1] = 0;
                    acc[2] = 0;

                    for (var x = 0; x < num_coeff; x++) {
                        var src_offset = ((y_block_offset + y) * width + x_block_offset + x) * 4;
                        acc[0] += temp[src_offset + 0] * dct_matrix[x][k];
                        acc[1] += temp[src_offset + 1] * dct_matrix[x][k];
                        acc[2] += temp[src_offset + 2] * dct_matrix[x][k];
                    }

                    dst[dst_offset + 0] = acc[0] + 128;
                    dst[dst_offset + 1] = acc[1] + 128;
                    dst[dst_offset + 2] = acc[2] + 128;
                    dst[dst_offset + 3] = 255;
                }
            }
        }
    }
}

function fast_fdct(src, dst, width, height) {
}

function fast_idct(src, dst, width, height, coeff_ratio) {
}

function butterworth_filter(src, dst, width, height, n) {
    for (var y_block_offset = 0; y_block_offset < height; y_block_offset += BLOCK_SIZE) {
        for (var x_block_offset = 0; x_block_offset < width; x_block_offset += BLOCK_SIZE) {
            for (var y = 0; y < BLOCK_SIZE; y++) {
                for (var x = 0; x < BLOCK_SIZE; x++) {
                    var u = x / (BLOCK_SIZE - 1);
                    var v = y / (BLOCK_SIZE - 1);
                    var w = 1 / (1 + Math.pow(Math.sqrt(u * u + v * v) / 0.4, 2 * n));

                    var offset = ((y_block_offset + y) * width + x_block_offset + x) * 4;
                    dst[offset + 0] = w * (src[offset + 0] - 128) + 128;
                    dst[offset + 1] = w * (src[offset + 1] - 128) + 128;
                    dst[offset + 2] = w * (src[offset + 2] - 128) + 128;
                }                
            }
        }
    }
}

function gaussian_filter(src, dst, width, height) {
}

return { main: main, 
         onchanged_image: onchanged_image, 
         onchanged_coefficients: onchanged_coefficients };

}();