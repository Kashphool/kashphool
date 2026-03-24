import type { Plugin } from 'vite';

/**
 * Vite plugin to fix scientific notation in oklab() colors
 * Converts values like -4.37114e-1 to -0.437114
 */
export function fixOklabScientificNotation(): Plugin {
  return {
    name: 'fix-oklab-scientific-notation',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          let css = chunk.source as string;

          // Replace scientific notation in oklab() with decimal notation
          css = css.replace(/oklab\([^)]*\)/g, (match) => {
            return match.replace(/(-?\d+\.?\d*)e-(\d+)/gi, (_, mantissa, exponent) => {
              const result = parseFloat(mantissa) * Math.pow(10, -parseInt(exponent));
              // Keep precision but avoid unnecessary decimals
              return result.toFixed(Math.max(6, parseInt(exponent) + 2));
            });
          });

          chunk.source = css;
        }
      }
    },
  };
}
