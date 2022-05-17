# recreate-portainer-action
access portainer and recreate docker container

# Guide
- run your stack with docker compose first
- Setup your github action:
`- name: Recreate portainer container
  uses: antn9x/recreate-portainer-action@main
  with:
    portainer-connect-uri: ${{ secrets.PORTAINER_CONNECT_URI }}
    stack-id: 2
    container-name: ${{ steps.meta.outputs.tags }}
`
- Add secrets.PORTAINER_CONNECT_URI to your github repo
