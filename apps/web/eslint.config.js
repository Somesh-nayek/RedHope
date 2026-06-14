import nextPlugin from '@next/eslint-plugin-next';
import base from '@red-hope/config/eslint/base';

export default [...base, nextPlugin.flatConfig.recommended, nextPlugin.flatConfig.coreWebVitals];
