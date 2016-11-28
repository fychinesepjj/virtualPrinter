(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.utils = factory();
    }

})(this, function () {
    
    var utils = {
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
                console.error(e, 'utils: deepCopy');
            }
            return null;
        },
        trimRight: function trimRight(innerStr, keyWord) {
            var escapedWord = keyWord.replace(/([\[\]\/.()])/g, '\\$1');
            var reg = new RegExp(escapedWord + '\\s*$');
            return innerStr.replace(reg, '');
        },
        trimLeft: function trimLeft(innerStr, keyWord) {
            var escapedWord = keyWord.replace(/([\[\]\/.()])/g, '\\$1');
            var reg = new RegExp('^\\s*' + escapedWord);
            return innerStr.replace(reg, '');
        },
        trim: function trim(innerStr, keyWord) {
            var str = this.trimLeft(innerStr, keyWord);
            str = this.trimRight(str, keyWord);
            return str;
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
        padding: function (str, width, placeHolder, direction) {
            direction = direction || 'left';
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
                var paddingStr = padding(width - strLen);
                if (direction === 'right') {
                    return str + paddingStr;
                } else {
                    return paddingStr + str;
                }
            }
            return str;
        },
        padRight: function (str, width, placeHolder) {
            return this.padding(str, width, placeHolder, 'right');
        },
        padLeft: function (str, width, placeHolder) {
            return this.padding(str, width, placeHolder, 'left');
        },
        isArray: function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        isPlainObject: function isPlainObject(obj) {
            return !!obj && Object.prototype.toString.call(obj) === '[object Object]';
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

    return utils;
});