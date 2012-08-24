DIR = `pwd`
PEM = key.pem
DATE = `date "+%Y-%m-%d-%H-%M-%S"`
MESSAGE_BOX = --no-message-box

all:
	echo "Does nothing by default. Try dist or dist-init."

package:
	# The --no-message-box flag does not seem to work, so Chrome will display a
	# box when packaging...
	/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
	--pack-extension=$(DIR)/src/ \
	--pack-extension-key=$(DIR)/config/$(PEM) \
	$(MESSAGE_BOX); \
	mv $(DIR)/src.crx $(DIR)/dist/reader_$(DATE).crx

package-init:
	/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
	--pack-extension=$(DIR)/src/ \
	$(MESSAGE_BOX); \
	mv $(DIR)/src.crx $(DIR)/dist/reader_$(DATE).crx; \
	mv $(DIR)/src.pem $(DIR)/config/$(PEM)

clear:
	rm -v $(DIR)/dist/*.crx