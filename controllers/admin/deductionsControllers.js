const Salaryslab = require("../../models/SalarySalb.Model");

module.exports.salarySlab = async (req, res) => {
  try {
    const { minimum, maximum, hra, pf, insurance, tax } = req.body;

    const salaryExist = await Salaryslab.findOne({
      minimum: minimum,
      maximum: maximum
    });

    if (salaryExist) {
      return res.status(400).json({
        message: "slab Already exist"
      });
    }
    const salary = new Salaryslab({
      minimum,
      maximum,
      hra,
      pf,
      insurance,
      tax
    });

    await salary.save();

    return res.status(201).json({
      message: "slab create successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.salarySlabupdate = async (req, res) => {
  try {
    const { minimum, maximum, hra, pf, insurance, tax } = req.body;
    const id = req.params.id;
    await Salaryslab.findByIdAndUpdate(id, {
      minimum,
      maximum,
      hra,
      pf,
      insurance,
      tax
    });
    return res.status(201).json({
      message: "slab update successfully"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.salarySlabDelete = async (req, res) => {
  try {
    const id = req.params.id;

    const salary = await Salaryslab.findByIdAndDelete(id);

    return res.status(200).json({
      message: "slab delete successfully",
      data: salary
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
