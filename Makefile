dir = `pwd`
pem = key.pem
date = `date "+%Y-%m-%d-%H-%M-%S"`
message_box = --no-message-box
chrome = /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
coffee = ./node_modules/.bin/coffee

build:
	$(coffee) -o ./src/js ./src/coffee;

package:
	# The --no-message-box flag does not seem to work, so Chrome will display a
	# box when packaging...
	@$(chrome) \
	--pack-extension=$(dir)/src/ \
	--pack-extension-key=$(dir)/config/$(pem) \
	$(message_box); \
	mv $(dir)/src.crx $(dir)/dist/reader_$(date).crx

package-init:
	@$(chrome) \
	--pack-extension=$(dir)/src/ \
	$(message_box); \
	mv $(dir)/src.crx $(dir)/dist/reader_$(date).crx; \
	mv $(dir)/src.pem $(dir)/config/$(pem)

clear:
	@rm -v $(dir)/dist/*.crx

.PHONY: build package package-init clear
