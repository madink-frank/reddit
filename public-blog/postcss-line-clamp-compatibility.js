/**
 * PostCSS plugin to add standard line-clamp property alongside -webkit-line-clamp
 * for better browser compatibility
 */

function lineClampCompatibility() {
  return {
    postcssPlugin: 'line-clamp-compatibility',
    Declaration(decl) {
      // If we find a -webkit-line-clamp declaration, add the standard line-clamp property
      if (decl.prop === '-webkit-line-clamp') {
        // Insert the standard line-clamp property after the webkit one
        decl.cloneBefore({
          prop: 'line-clamp',
          value: decl.value
        });
      }
    }
  };
}

lineClampCompatibility.postcss = true;

module.exports = lineClampCompatibility;