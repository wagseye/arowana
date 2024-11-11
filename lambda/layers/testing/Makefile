build-TestingLayer:
	cd node_modules/testing; \
		rm -rf ./dist; \
		rm -rf ./node_modules; \
		npm install; \
		npm run build
	mkdir -p $(ARTIFACTS_DIR)/nodejs
	cp -R ./node_modules $(ARTIFACTS_DIR)/nodejs
