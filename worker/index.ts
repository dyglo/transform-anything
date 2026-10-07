// No processing API or cloud bindings are required by the local-only release.
export default {
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
