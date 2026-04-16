import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Navigation, Footer } from "../components/SharedComponents";
import { seedFirestoreWithProducts } from "../utils/seedDatabase";
import { useProducts } from "../contexts/ProductContext";
import { uploadProductImage, updateProduct } from "../services/firestoreService";

const Admin = () => {
  const { products, refetchProducts, loading } = useProducts();
  const [seeding, setSeeding] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    const success = await seedFirestoreWithProducts();
    if (success) {
      await refetchProducts();
    }
    setSeeding(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: number,
    imageType: 'main' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.warn('No file selected');
      return;
    }

    try {
      setUploadingId(productId);
      
      // Step 1: Upload image to Cloud Storage
      console.log(`Uploading ${imageType} image for product ${productId}...`);
      const imageUrl = await uploadProductImage(file, productId, imageType);
      console.log('Image uploaded successfully:', imageUrl);
      
      // Step 2: Get the current product data
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Step 3: Update product document with new image URL
      if (imageType === 'main') {
        console.log('Saving main image URL to Firestore...');
        await updateProduct(productId, {
          ...product,
          image: imageUrl
        });
      } else if (imageType === 'gallery') {
        console.log('Adding gallery image URL to Firestore...');
        const updatedImages = [...(product.images || []), imageUrl];
        await updateProduct(productId, {
          ...product,
          images: updatedImages
        });
      }
      
      console.log('Product updated successfully');
      alert(`Image uploaded and saved successfully!`);
      
      // Step 4: Refresh product list
      await refetchProducts();
      
      // Reset the input
      e.target.value = '';
    } catch (error) {
      console.error('Full error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMessage}\n\nCheck console for more details.`);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Admin Panel</h1>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Database Management */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Database Management</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Seed Database with Products</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This will populate your Firestore database with the initial product data.
                  Only run this once when setting up for the first time.
                </p>
                <Button
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {seeding ? "Seeding Database..." : "Seed Database"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Database Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-3xl font-bold text-accent">
                  {loading ? "Loading..." : products.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm">Connected to Firestore</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Image Management Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">📷 Manage Product Images</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Upload new images for your products. Images are stored in Firebase Cloud Storage.
          </p>

          {loading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No products in database yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg p-4">
                  <button
                    onClick={() =>
                      setExpandedProductId(
                        expandedProductId === product.id ? null : product.id
                      )
                    }
                    className="w-full flex items-center justify-between text-left hover:bg-secondary/50 p-2 rounded transition"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground">
                      {expandedProductId === product.id ? "▼" : "▶"}
                    </span>
                  </button>

                  {expandedProductId === product.id && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-border">
                      {/* Main Image Upload */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Main Product Image
                        </Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, product.id, 'main')}
                            disabled={uploadingId === product.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingId === product.id}
                          >
                            {uploadingId === product.id ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Current: {product.image?.substring(0, 50)}...
                        </p>
                      </div>

                      {/* Gallery Images */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Gallery Images ({product.images?.length || 0})
                        </Label>
                        <div className="flex gap-2 mb-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, product.id, 'gallery')}
                            disabled={uploadingId === product.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={uploadingId === product.id}
                          >
                            {uploadingId === product.id ? "Uploading..." : "Add"}
                          </Button>
                        </div>

                        {/* Display Gallery Images */}
                        {product.images && product.images.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {product.images.map((imageUrl, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-square rounded border border-border overflow-hidden group"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <p className="text-white text-xs">Image {idx + 1}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                        <p className="font-medium text-blue-900 mb-1">💡 Tips:</p>
                        <ul className="text-blue-800 text-xs space-y-1">
                          <li>• Supported formats: JPG, PNG, WebP</li>
                          <li>• Recommended size: 1200x1200px</li>
                          <li>• Images are auto-optimized by Firebase</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Product List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Products in Database</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No products in database yet.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click "Seed Database" above to add initial products.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-sm">ID</th>
                    <th className="text-left p-3 text-sm">Name</th>
                    <th className="text-left p-3 text-sm">Price</th>
                    <th className="text-left p-3 text-sm">Category</th>
                    <th className="text-left p-3 text-sm">Collection</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border">
                      <td className="p-3 text-sm font-medium">{product.id}</td>
                      <td className="p-3 text-sm">{product.name}</td>
                      <td className="p-3 text-sm font-semibold">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="capitalize bg-secondary px-2 py-1 rounded text-xs">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3 text-sm capitalize">{product.collection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Firebase Setup Info */}
        <Card className="p-6 mt-8 bg-yellow-50 border-yellow-200 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-yellow-900">🔧 Troubleshooting Image Upload</h2>
          <div className="text-sm text-yellow-800 space-y-3">
            <p className="font-medium">If image upload is not working:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <strong>Open Browser Console:</strong> Press F12 or right-click → Inspect → Console tab
              </li>
              <li>
                <strong>Look for errors:</strong> Check if there are any red error messages
              </li>
              <li>
                <strong>Check Firebase rules:</strong> Go to Firebase Console → Storage → Rules
                <br />
                <span className="text-xs text-yellow-700 ml-4 block">Ensure rule allows writes: `allow write: if true;` for test mode</span>
              </li>
              <li>
                <strong>Verify Firebase config:</strong> Check that `.env.local` has correct Firebase credentials
              </li>
              <li>
                <strong>Check network:</strong> Go to Console → Network tab, try uploading again, look for failed requests
              </li>
              <li>
                <strong>Check product data:</strong> Select a product in Firestore to verify it has all required fields
              </li>
            </ol>
            <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3 text-xs">
              <strong>💡 Tip:</strong> All error messages will appear in the browser console and in alert boxes. Open the console (F12) before trying to upload!
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-8 bg-green-50 border-green-200">
          <h2 className="text-lg font-semibold mb-3 text-green-900">✅ Firebase Connected</h2>
          <div className="text-sm text-green-800 space-y-2">
            <p>Your database is connected and ready to use!</p>
            <p className="mt-3">📚 Learn more:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a
                  href="https://firebase.google.com/docs/storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Firebase Storage Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://firebase.google.com/docs/firestore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Firestore Documentation
                </a>
              </li>
            </ul>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
