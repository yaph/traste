# Call example: make release version=0.3.0
release:
	git tag -a $(version) -m 'Create version $(version)'
	git push --tags
	npm publish