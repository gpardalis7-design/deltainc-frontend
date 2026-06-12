
  # DELTAINC

  This is a code bundle for DELTAINC. The original project is available at https://www.figma.com/design/rbPUfct266VR3MTtVmI8ZE/DELTAINC.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Production note

  WordPress remains the content source for articles and programs, while Vercel serves the public frontend.

  To keep `public/sitemap.xml` fresh after new WordPress content is published, production should use a Vercel deploy hook so each publish triggers a new frontend build.
  
