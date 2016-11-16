var Utils = {
    intersect: function intersect(arr, separator, hasBoundary) {
        var newArr = [];
        if (separator) {
            var arrLen = arr.length;
            if (arrLen === 1) {
                newArr = arr.slice();
            } else {
                arr.forEach(function (item, index) {
                    newArr.push(item);
                    if ((index + 1) !== arrLen) {
                        newArr.push(separator);
                    }
                });
            }
            if (hasBoundary) {
                newArr.push(separator);
                newArr.unshift(separator);
            }
            return newArr;
        }
        return arr;
    },
    deepCopy: function deepCopy(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.error(e, 'Utils: deepCopy');
        }
        return null;
    },
    trimRight: function trimTail(innerStr, keyWord) {
        var reg = new RegExp(keyWord + '\\s*$');
        return innerStr.replace(reg, '');
    },
    strLen: function strLen(str) {
        var len = str.length;
        var count = 0;
        var i = 0;
        if (len === 0) return count;
        for (; i < len; i += 1) {
            if ((str.charCodeAt(i) & 0xff00) !== 0) {
                count += 1;
            }
            count += 1;
        }
        return count;
    },
    cutStrLen: function cutLen(str, len) {
        len = Number(len);
        if (len <= 0) return [str];
        var thisUtils = this;
        var cutResult = [];
        var strArray = str.split('');
        var count = 0;
        var isFinished = false;
        while (strArray.length) {
            var wordArray = [];
            var count = 0;
            var word = strArray.shift();
            var wordLen = thisUtils.strLen(word);
            count += wordLen;
            while (count <= len) {
                wordArray.push(word);
                word = strArray.shift();
                if (!word) {
                    isFinished = true;
                    break;
                }
                wordLen = thisUtils.strLen(word);
                count += wordLen;
            }
            if (wordArray.length) {
                cutResult.push(wordArray.join(''));
            } else {
                cutResult.push('#');
                continue;
            }
            if (count !== len && !isFinished) {
                strArray.unshift(word);
            }
        }
        return cutResult;
    },
    padRight: function (str, width, placeHolder) {
        placeHolder = placeHolder || ' ';
        width = Number(width);
        function padding (len) {
            if (len <= 0) return '';
            var padArray = [];
            while (len--) {
                padArray.push(placeHolder);
            }
            return padArray.join('');
        }
        if (!str || !str.length) {
            return padding(width);
        }
        var strLen = this.strLen(str);
        if (strLen < width) {
            return str + padding(width - strLen);
        }
        return str;
    },
    isArray: function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    },
    isPlainObject: function isPlainObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    },
    isString: function isString(obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    },
    assign: function assign() {
        var extend,
            _extend,
            _isObject;

        _isObject = function(o){
            return Object.prototype.toString.call(o) === '[object Object]';
        }

        _extend = function self(destination, source){
            for (var property in source) {
                if (source.hasOwnProperty(property)) {

                    // 若sourc[property]是对象，则递归
                    if (_isObject(source[property])) {

                        // 若destination没有property，赋值空对象
                        if (!destination.hasOwnProperty(property)) {
                            destination[property] = {};
                        };

                        // 对destination[property]不是对象，赋值空对象
                        if (!_isObject(destination[property])) {
                            destination[property] = {};
                        };

                        // 递归
                        self(destination[property], source[property]);
                    } else {
                        destination[property] = source[property];
                    };
                }
            }
        }
        var arr = arguments,
            result = {},
            i;

        if (!arr.length) return {};

        for (i = 0; i < arr.length; i++) {
            if (_isObject(arr[i])) {
                _extend(result, arr[i])
            };
        }

        arr[0] = result;
        return result;
    }
};
