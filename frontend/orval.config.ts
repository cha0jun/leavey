import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: 'http://localhost:8000/openapi.json',
        output: {
            target: './lib/api/index.ts',
            client: 'react-query',
            mode: 'tags-split',
            override: {
                mutator: {
                    path: './lib/api/axios-instance.ts',
                    name: 'customInstance',
                },
            },
        },
        hooks: {
            afterAllFilesWrite: 'npx prettier --write',
        },
    },
});
