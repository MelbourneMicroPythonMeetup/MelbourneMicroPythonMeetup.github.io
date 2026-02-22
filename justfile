# View the site locally in a browser
view:
    docker run -it --rm -v "$PWD":/usr/src/app -p "4000:4000" starefossen/github-pages
