exports.getPurchase = (req, res, next) => {
  const package = req.params.package;
  res.status(200).json({
    packageName: package,
    totalPrice: package === 'premium' ? 60 : 24
  });
};
