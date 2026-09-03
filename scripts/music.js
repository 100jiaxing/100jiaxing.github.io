'use strict';

hexo.extend.filter.register('before_post_render', function (data) {
  var music = hexo.config.music;
  if (!music) {
    return data;
  }
  data.content = data.content.split('[music]').join(music);
  return data;
});
