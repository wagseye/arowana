build-DatabaseDirectLayer:
	cd node_modules/database-connector; \
		rm -rf ./dist; \
		rm -rf ./node_modules; \
		npm install; \
		npm run build
	mkdir -p $(ARTIFACTS_DIR)/nodejs
	cp -R ./node_modules $(ARTIFACTS_DIR)/nodejs
