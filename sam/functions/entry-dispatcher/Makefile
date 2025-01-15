
build-EntryDispatcher:
	npx install-local;
	mkdir -p $(ARTIFACTS_DIR)
	npx esbuild src/**/*.ts \
		--platform=node \
		--outdir=$(ARTIFACTS_DIR) \
		--target=esnext \
		--format=esm \
		--sourcemap \
		--out-extension:.js=.mjs
	cp -R ./node_modules $(ARTIFACTS_DIR)
