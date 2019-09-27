exports.getPagination = (totalItems, itemsPerPage, page, by, search) => {
  return {
    totalItems: totalItems,
    itemsPerPage: itemsPerPage,
    currentPage: page,
    hasNextPage: itemsPerPage * page < totalItems,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalItems / itemsPerPage),
    filterUrl: (by ? `&by=${by}` : "") + (search ? `&search=${search}` : "")
  };
};
