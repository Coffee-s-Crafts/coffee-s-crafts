# Local build

To build the site locally with environment variables:

```bash
SITE_TITLE="My Art" CONTACT_EMAIL="me@example.com" VGEN_URL="https://vgen.co/CoffeeEX" node site/build.js
```

The generated site will be written to `dist/`.

Using Git LFS

This project stores large artwork in `assets/art/`. To work with these files locally, install Git LFS and track the art folder:

```bash
# install (one-time)
git lfs install

# track art files (one-time)
git lfs track "assets/art/*"

# then add the .gitattributes file and commit
git add .gitattributes
git commit -m "Track art assets with Git LFS"

# when cloning elsewhere, run:
git lfs install
git clone <repo-url>
```

The GitHub Actions workflow already enables LFS when checking out the repository.
