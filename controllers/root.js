exports.getPurchase = (req, res) => {
  const userPackage = req.params.package;
  res.status(200).json({
    packageName: userPackage,
    totalPrice: userPackage === 'premium' ? 60 : 24
  });
};
