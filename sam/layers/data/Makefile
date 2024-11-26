build-DataLayer:
	cd node_modules/data; \
		rm -rf ./dist; \
		echo rm -rf ./node_modules; \
		npm install; \
		npm run build
	mkdir -p $(ARTIFACTS_DIR)/nodejs
	cp -R ./node_modules $(ARTIFACTS_DIR)/nodejs
