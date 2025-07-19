// import banner from '../../assets/static/banner.png'

const ContainerOne = () => {
  return (
    <div
      className="w-full max-w-md py-2 rounded-xl border border-blue-500 bg-cover bg-center text-white text-center"
      // style={{ backgroundImage: `url(${banner})` }} // replace with actual image path
    >
      <h1 className="!text-3xl font-semibold mb-2">Rupexo</h1>
      <p className="text-base leading-relaxed">
        Exchange more, earn more <br />
        make your life better
      </p>
    </div>

  )
}

export default ContainerOne