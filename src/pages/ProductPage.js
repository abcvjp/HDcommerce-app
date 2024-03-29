import {
  useState, useEffect, useRef, useCallback
} from 'react';
import { useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Helmet } from 'react-helmet';

import {
  Grid, makeStyles, Box, Paper, Divider, Button, Typography, Container
} from '@material-ui/core';
import { generateBreadCrumbs, isArrayEmpty, isObjectEmpty } from 'src/utils/utilFuncs';
import { checkAndAddToCart } from 'src/actions/cartActions';
import { showAlertMessage } from 'src/actions/alertMessageActions';

import Breadcrumbs from 'src/components/accesscories/Breadcrumbs';
import ProductDetail from 'src/components/Product/ProductDetail';
import QuantitySelector from 'src/components/accesscories/QuantitySelector';
import ProductImages from 'src/components/Product/ProductImages';
import ProductDescription from 'src/components/Product/ProductDescription';
import { productApi } from 'src/utils/api';

import { APP_TITLE } from 'src/constants/appInfo';
import Products from 'src/components/Product/Products';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '80%'
  },
  detail: {
    padding: theme.spacing(2)
  },
  marginBlock: {
    marginBlock: theme.spacing(2)
  },
  margin: {
    margin: theme.spacing(2)
  },
  addcart: {
    fontWeight: 'bold',
    background: '#212529',
    color: '#ffffff',
    border: 'solid 2px #212529',
    transition: 'all 0.5s ease-in-out 0s',
    '&:hover': {
      background: 'transparent',
      color: '#212529',
    }
  },
  buynow: {
    marginLeft: theme.spacing(1),
    fontWeight: 'bold',
    background: 'red',
    color: '#ffffff',
    border: 'solid 2px red',
    transition: 'all 0.5s ease-in-out 0s',
    '&:hover': {
      background: 'transparent',
      color: 'red'
    }
  },
  title: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(2)
  }
}));

const ProductPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mapCategoryNameId = useSelector((state) => state.categories.map_name_id);

  const { productId } = useParams();
  const data = useRef({
    product: null,
    related_products: [],
    breadcrumbs: []
  });
  const [qty, setQty] = useState(1);

  const { product } = data.current;

  const [, forceRerender] = useState(Date.now());

  const handleQtyChange = useCallback((event) => {
    const newQty = parseInt(event.target.value, 10);
    if (newQty > product.stockQuantity) {
      dispatch(showAlertMessage({ type: 'error', content: `You can only buy ${product.quantity} product` }));
    } else setQty(newQty);
  });

  const handleAddtoCart = useCallback(() => {
    dispatch(checkAndAddToCart({
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      price: product.price,
      quantity: qty
    }));
  });

  const handleBuyNow = useCallback(() => {
    if (product.enable === false) {
      dispatch(showAlertMessage({ type: 'error', content: 'This product has been disabled' }));
    } else if (product.quantity === 0) {
      dispatch(showAlertMessage({ type: 'error', content: 'This product has sold out' }));
    } else {
      navigate('/checkout', {
        state: {
          pathname: '/checkout',
          orderItems: [{
            product_id: product._id,
            product_name: product.name,
            product_slug: product.slug,
            product_thumbnail: product.thumbnail ? product.thumbnail : null,
            price: product.price,
            quantity: qty
          }]
        }
      });
    }
  });

  useEffect(() => {
    Promise.all([productApi.getProductById(productId).then((response) => response.data.data).catch((err) => {
      console.log(err);
    }),
    productApi.getRelatedProducts(productId).then((response) => response.data.data).catch((err) => {
      console.log(err);
    })
    ]).then(([productData, relatedProducts]) => {
      data.current.product = productData;
      data.current.related_products = relatedProducts;
      forceRerender(Date.now());
    });
  }, [productId]);

  useEffect(() => {
    if (product && !isObjectEmpty(mapCategoryNameId)) {
      data.current = {
        ...data.current,
        product,
        breadcrumbs: generateBreadCrumbs(product.category.path.concat(product.name), mapCategoryNameId)
      };
      forceRerender(Date.now());
    }
  }, [product, mapCategoryNameId]);

  return (
    <Container maxWidth="lg" className={classes.root}>
      {!isArrayEmpty(data.current.breadcrumbs) && <Breadcrumbs breadcrumbs={data.current.breadcrumbs} />}
      {product && (
      <>
        <Helmet>
          <title>
            {`${product.metaTitle} | ${APP_TITLE}`}
          </title>
          <meta name="description" content={product.metaDescription} />
          <meta name="keywords" content={product.metaKeywords} />
        </Helmet>

        <Paper className={classes.detail} elevation={0}>
          <Grid container direction="row" justifyContent="space-between" spacing={4}>

            <Grid
              key="product_images"
              item
              xs={12}
              md={5}
            >
              {product.images && <ProductImages images={product.images} productName={product.name} />}
            </Grid>

            <Grid
              key="product_detail"
              className={`${classes.detail}`}
              md={7}
              item
              container
              direction="column"
              justifyContent="flex-start"
            >
              <Grid item>
                <ProductDetail product={product} />
              </Grid>

              <Grid item>
                <Divider light />
                <div id="select-area">
                  <Box sx={{ my: 2 }}>
                    <QuantitySelector qty={qty} handleQtyChange={handleQtyChange} />
                  </Box>
                  <Button
                    className={classes.addcart}
                    variant="contained"
                    color="primary"
                    size="medium"
                    disableElevation
                    onClick={handleAddtoCart}
                  >
                    ADD TO CART
                  </Button>
                  <Button
                    className={classes.buynow}
                    variant="contained"
                    color="primary"
                    size="medium"
                    disableElevation
                    onClick={handleBuyNow}
                  >
                    BUY NOW
                  </Button>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ my: 4 }}>
          <div id="product-description">
            <ProductDescription description={product.description} />
          </div>
        </Box>

        <Typography variant="h6" className={classes.title}>Related Products</Typography>
        <Paper elevation={0}>
          {
            !isArrayEmpty(data.current.related_products) ? <Products products={data.current.related_products} />
              : (
                <Box m={2}>
                  <Typography>There are no available related products now!</Typography>
                </Box>
              )
        }
        </Paper>
      </>
      )}
    </Container>
  );
};

export default ProductPage;
