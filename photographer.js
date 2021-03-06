//  Photographer.js 0.0.2
//  (c) 2012 Jake Harding
//  Photographer.js is freely distributable under the MIT license.

(function() {

  // cross-browser normalization references
  // --------------------------------------

  var URL = null;
  var getUserMedia = null;

  var normalizeGlobalReferences = function() {
    URL = window.URL || window.webkitURL || window.mozURL ||
          window.msURL || window.oURL;

    getUserMedia = navigator.getUserMedia ||
                   navigator.webkitGetUserMedia ||
                   navigator.mozGetUserMedia ||
                   navigator.msGetUserMedia ||
                   navigator.oGetUserMedia;
  };

  // Photographer: say cheese!
  // -------------------------

  // default configurations
  var defaults = {
    flash: null,
    container: null, // required
    imgFormat: 'png',
    imgWidth: null,
    imgHeight: null
  };

  var Photographer = function(config) {
    this._config = extend(defaults, config);

    // missing required configuraiton
    if (!this._config.container) {
      throw new Error('Photographer.js requires a container element');
    }

    this._stream = null;

    this._photos = [];

    // dimensions of container element
    var width = this._config.container.clientWidth;
    var height = this._config.container.clientHeight;

    // if imgWidth and imgHeight weren't explicitly set,
    // inherit values from the dimensions of the container
    this._config.imgWidth || (this._config.imgWidth = width);
    this._config.imgHeight || (this._config.imgHeight = height);

    // video element is where the webcam stream
    // gets piped to for the live preview
    this._video = document.createElement('video');
    this._video.width = width;
    this._video.height = height;
    this._config.container.appendChild(this._video);

    // canvas element is used to capture images
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._config.imgWidth;
    this._canvas.height = this._config.imgHeight;

    this._context = this._canvas.getContext('2d');

    // would prefer to do this once in IIFE, but normalizing the references
    // whenever a Photographer instance is created makes for easier testing
    normalizeGlobalReferences();

    // if the browser doesn't support getUserMedia, override
    // some methods to return false immediately
    if (!getUserMedia) {
      this.start = this.stop = this.takePhoto = function() {
        return false;
      };
    }
  };

  // prototype alias
  var proto = Photographer.prototype;

  proto.start = function() {
    var that = this;

    // getUserMedia worked :)
    var pipeStreamToVideo = function(stream) {
      that._stream = stream;

      try {
        // browsers that follow W3C spec (Chrome)
        that._video.src = URL.createObjectURL(stream);
      } catch(e) {
        // browsers that do not follow W3C spec (Firefox, Opera)
        that._video.src = stream;
      }

      that._video.play();
    };

    // getUserMedia failed :(
    var handleError = function(error) {
      throw new Error(error);
    };

    getUserMedia.call(navigator, { video: true }, pipeStreamToVideo,
                      handleError);

    return true;
  };

  proto.stop = function() {
    this._stream && this._stream.stop();
    delete this._stream;

    return true;
  };

  proto.takePhoto = function() {
    // if flash function is present, call it
    this._config.flash && this._config.flash(this._config.container);

    this._context.drawImage(this._video, 0, 0, this._config.imgWidth,
                            this._config.imgHeight);

    var src = this._canvas.toDataURL('image/' + this._config.imgFormat);
    var format = src.match(/^data:image\/(\w+);/)[1];

    var photo = {
      src: src,
      format: format,
      width: this._config.imgWidth,
      height: this._config.imgHeight
    };

    // push a copy of the latest photo into the photos array
    this._photos.push(extend(photo));

    return photo;
  };

  proto.getPhotos = function() {
    // return a copy of the photos array
    return this._photos.slice(0);
  };
  
  proto.removePhoto = function(index){
    //remove element at index
    this._photos.splice(index, 1);
  }
  
  proto.clearAll = function(index){
    //remove element at index
    this._photos.length = 0;
  }


  // expose globally
  window.Photographer = Photographer;

  // helper functions
  // ----------------

  // shallow copies
  var extend = function(target, obj) {
    var extendedObj = {};

    var key;
    for (key in target) {
      if (target.hasOwnProperty(key)) {
        extendedObj[key] = target[key];
      }
    }

    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        extendedObj[key] = obj[key];
      }
    }

    return extendedObj;
  };

})();
