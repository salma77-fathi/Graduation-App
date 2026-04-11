export const getProductFromDotNet = async (productId: number) => {
  const BASE_URL = "https://pickandpaydeploy.runasp.net";

  const response = await fetch(`${BASE_URL}/GetProductById/${productId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch product ${productId}: ${response.status}`);
  }

  const data = (await response.json()) as {
    status: string;
    id: number;
    name: string;
    pictureUrl: string;
    price: number;
    weight: number;
    currentStock: number;
    categoryId: number;
  };

  return {
    id: data.id,
    name: data.name,
    price: data.price,
    stock: data.currentStock,
    pictureUrl: data.pictureUrl,
    weight: data.weight,
    categoryId: data.categoryId,
  };
};
