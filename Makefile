dist:
	npm run build

# Call example: make release version=0.3.0
release: dist
	git tag -a $(version) -m 'Create version $(version)'
	git push --tags
	npm publish