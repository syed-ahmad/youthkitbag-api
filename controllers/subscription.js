exports.getPackage = (req, res) => {
  res.status(200).json({
    _id: '12345',
    title: 'Package title',
    description: 'Package description',
    details: [],
    price: 500.0
  });
};
