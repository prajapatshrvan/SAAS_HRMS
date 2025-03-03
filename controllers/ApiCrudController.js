const { default: mongoose } = require("mongoose");

class ApiCRUDController {
  constructor(model) {
    this.model = model;
  }

  // Create operation
  create = async data => {
    return await this.model.create(data);
  };

  // Read operation
  readAll = async () => {
    return await this.model.find({ status: "completed" });
  };

  readAllandPopulate = async (collections, userID, match) => {
    let lookups = match || [];
    if (userID) {
      lookups = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userID)
          }
        }
      ];
    }

    let filters = {
      $addFields: {}
    };

    let isFilters = false;

    collections.forEach(item => {
      if (item.filters) {
        isFilters = true;
        filters.$addFields[item.name] = {
          $filter: item.filters
        };
      }

      let aggrigate = {
        $lookup: {
          from: item.name,
          localField: item.local,
          foreignField: item.key,
          as: item.as
        }
      };
      lookups.push(aggrigate);
    });

    if (isFilters) {
      lookups.push(filters);
    }

    if (userID) lookups.push({ $limit: 1 });
    // console.log(JSON.stringify(lookups));
    const result = await this.model.aggregate([...lookups]);
    if (userID && result) return result[0];

    return result;
  };

  // Read operation by ID
  read = async id => {
    return await this.model.findById(id);
  };

  // Read operation One
  readOne = async empid => {
    return await this.model.findOne({ empid: empid });
  };

  // Search operation
  search = async query => {
    return await this.model.find(query);
  };

  // Update operation
  update = async (id, data) => {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  };

  // Delete operation
  delete = async id => {
    return await this.model.findByIdAndDelete(id);
  };
}
module.exports = ApiCRUDController;
