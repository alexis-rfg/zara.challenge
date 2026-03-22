/** Parameters accepted by fetchProducts in the service layer. */
export type FetchProductsParams = {
  /** Server-side filter term matching product name and brand. */
  search?: string;
  /** Maximum number of products to return. */
  limit?: string;
};
